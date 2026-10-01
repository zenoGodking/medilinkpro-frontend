import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FolderHeart, Camera, Upload, FileText, Trash2, X, ChevronLeft, ChevronRight, Plus, Eye,
} from 'lucide-react';
import {
  getDocumentsMedicaux, ajouterDocumentMedical, getPageDocument, supprimerDocumentMedical,
} from '../api/documentsMedicaux';
import { Card, Button, Spinner, EmptyState, FieldLabel, TextInput, Textarea, Select } from './ui';

const TYPES_DOCUMENT = {
  ANTECEDENT: 'Antécédents médicaux',
  ANCIEN_CARNET: 'Ancien carnet',
  RESULTAT_ANALYSE: "Résultat d'analyse",
  ORDONNANCE: 'Ordonnance',
  IMAGERIE: 'Imagerie (radio, écho...)',
  COMPTE_RENDU: 'Compte rendu',
  VACCINATION: 'Vaccination',
  AUTRE: 'Autre',
};

const PAGES_MAX = 20;
const TAILLE_MAX = 10 * 1024 * 1024;
const FORMULAIRE_VIDE = { type: 'ANCIEN_CARNET', titre: '', dateDocument: '', description: '' };

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso.length === 10 ? `${iso}T00:00` : iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Vignette locale d'une page en attente d'envoi (photo ou PDF). */
function ApercuLocal({ fichier, onRetirer, numero }) {
  const url = useMemo(() => (fichier.type.startsWith('image/') ? URL.createObjectURL(fichier) : null), [fichier]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return (
    <div className="relative w-20 h-24 rounded-lg border border-(--color-petrol-100) bg-(--color-ivory) overflow-hidden flex items-center justify-center">
      {url ? <img src={url} alt={`Page ${numero}`} className="w-full h-full object-cover" /> : <FileText size={26} className="text-(--color-petrol-400)" />}
      <span className="absolute bottom-0 left-0 right-0 text-[10px] text-center bg-black/50 text-white">{numero}</span>
      <button type="button" onClick={onRetirer} className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-white/90 text-(--color-clay-500)" aria-label="Retirer">
        <X size={12} />
      </button>
    </div>
  );
}

/** Une page d'un document, telechargee avec le JWT (remontee a chaque changement de page via key). */
function PageDistante({ documentId, index, page, onUrl }) {
  const [url, setUrl] = useState(null);
  const [erreur, setErreur] = useState(null);
  useEffect(() => {
    let annule = false;
    let objectUrl = null;
    getPageDocument(documentId, index)
      .then((blob) => {
        if (annule) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
        onUrl(objectUrl);
      })
      .catch(() => { if (!annule) setErreur('Impossible de charger cette page.'); });
    return () => {
      annule = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId, index, onUrl]);

  if (erreur) return <p className="text-white">{erreur}</p>;
  if (!url) return <Spinner className="w-8 h-8" />;
  return page?.typeMime === 'application/pdf'
    ? <iframe title={page.nomOriginal || 'PDF'} src={url} className="w-full h-full bg-white rounded-lg" />
    : <img src={url} alt={`Page ${index + 1}`} className="max-w-full max-h-full object-contain rounded-lg" />;
}

/** Visionneuse plein ecran des pages d'un document. */
function Visionneuse({ document, onFermer }) {
  const [index, setIndex] = useState(0);
  const [url, setUrl] = useState(null);
  const page = document.pages[index];

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onFermer();
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, document.pages.length - 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [document.pages.length, onFermer]);

  function allerA(i) {
    setUrl(null);
    setIndex(i);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col" role="dialog" aria-modal="true">
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="font-semibold truncate">{document.titre}</p>
          <p className="text-xs text-white/70">Page {index + 1} / {document.pages.length}{page?.nomOriginal ? ` · ${page.nomOriginal}` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {url && <a href={url} target="_blank" rel="noreferrer" className="text-sm underline">Ouvrir</a>}
          <button type="button" onClick={onFermer} className="p-2 rounded-full hover:bg-white/10" aria-label="Fermer"><X size={20} /></button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center gap-2 px-2 pb-4 min-h-0">
        <button type="button" disabled={index === 0} onClick={() => allerA(index - 1)}
          className="p-2 rounded-full text-white hover:bg-white/10 disabled:opacity-20" aria-label="Page précédente">
          <ChevronLeft size={28} />
        </button>
        <div className="flex-1 h-full flex items-center justify-center min-w-0">
          <PageDistante key={index} documentId={document.id} index={index} page={page} onUrl={setUrl} />
        </div>
        <button type="button" disabled={index >= document.pages.length - 1} onClick={() => allerA(index + 1)}
          className="p-2 rounded-full text-white hover:bg-white/10 disabled:opacity-20" aria-label="Page suivante">
          <ChevronRight size={28} />
        </button>
      </div>
    </div>
  );
}

/**
 * Documents medicaux du carnet : antecedents, anciens carnets papier scannes page par page
 * (appareil photo du telephone) ou importes (photos, PDF). Lecture pour tous ceux qui voient
 * le carnet ; ajout pour le patient (ou un medecin autorise, peutAjouter).
 */
export default function DocumentsMedicauxCard({ patientId, peutAjouter = false, titre = 'Antécédents et anciens carnets' }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState(FORMULAIRE_VIDE);
  const [fichiers, setFichiers] = useState([]);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [affiche, setAffiche] = useState(null);
  const [filtre, setFiltre] = useState('');
  const cameraRef = useRef(null);
  const importRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getDocumentsMedicaux(patientId)
      .then((d) => { if (!cancelled) setDocuments(d); })
      .catch(() => { if (!cancelled) setDocuments([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [patientId]);

  function ajouterFichiers(liste) {
    setErreur(null);
    const nouveaux = Array.from(liste || []);
    const refuse = nouveaux.find((f) => f.size > TAILLE_MAX || !(f.type.startsWith('image/') || f.type === 'application/pdf'));
    if (refuse) {
      setErreur(`« ${refuse.name} » : seuls les images et PDF de 10 Mo maximum sont acceptés.`);
    }
    const valides = nouveaux.filter((f) => f !== refuse && f.size <= TAILLE_MAX && (f.type.startsWith('image/') || f.type === 'application/pdf'))
      // La camera du telephone nomme souvent ses photos "image.jpg" : on numerote les pages.
      .map((f, i) => (f.name && f.name !== 'image.jpg' ? f
        : new File([f], `page-${fichiers.length + i + 1}.jpg`, { type: f.type })));
    setFichiers((prev) => [...prev, ...valides].slice(0, PAGES_MAX));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (fichiers.length === 0) {
      setErreur('Scannez ou importez au moins une page.');
      return;
    }
    setEnvoi(true);
    setErreur(null);
    try {
      const doc = await ajouterDocumentMedical(patientId, {
        type: form.type,
        titre: form.titre.trim(),
        description: form.description || null,
        dateDocument: form.dateDocument || null,
      }, fichiers);
      setDocuments((prev) => [doc, ...prev]);
      setForm(FORMULAIRE_VIDE);
      setFichiers([]);
      setOuvert(false);
    } catch (err) {
      setErreur(err.response?.data?.message || (err.response?.status === 413
        ? 'Envoi trop volumineux (60 Mo maximum par document).' : "L'envoi a échoué."));
    } finally {
      setEnvoi(false);
    }
  }

  async function handleSupprimer(doc) {
    if (!window.confirm(`Supprimer « ${doc.titre} » ?`)) return;
    await supprimerDocumentMedical(doc.id);
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
  }

  const fermerVisionneuse = useCallback(() => setAffiche(null), []);
  const visibles = filtre ? documents.filter((d) => d.type === filtre) : documents;

  return (
    <section>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 className="font-display font-semibold text-lg text-(--color-ink-900) flex items-center gap-2">
          <FolderHeart size={19} className="text-(--color-petrol-600)" /> {titre}
        </h2>
        <div className="flex items-center gap-2">
          {documents.length > 0 && (
            <div className="w-48">
              <Select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
                <option value="">Tous les documents</option>
                {Object.entries(TYPES_DOCUMENT).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </div>
          )}
          {peutAjouter && !ouvert && (
            <Button variant="amber" onClick={() => setOuvert(true)}><Plus size={15} /> Ajouter</Button>
          )}
        </div>
      </div>

      {ouvert && (
        <Card className="p-5 mb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Type de document</FieldLabel>
                <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                  {Object.entries(TYPES_DOCUMENT).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              </div>
              <div>
                <FieldLabel>Date du document (si connue)</FieldLabel>
                <TextInput type="date" max={new Date().toISOString().slice(0, 10)} value={form.dateDocument}
                  onChange={(e) => setForm((f) => ({ ...f, dateDocument: e.target.value }))} />
              </div>
            </div>
            <div>
              <FieldLabel>Titre</FieldLabel>
              <TextInput required maxLength={200} placeholder="Ex : Carnet de santé 2015-2020, Bilan cardiologique..."
                value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} />
            </div>
            <div>
              <FieldLabel>Notes (optionnel)</FieldLabel>
              <Textarea rows={2} maxLength={4000} placeholder="Ex : opération de l'appendicite en 2012, asthme depuis l'enfance..."
                value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>

            <div>
              <FieldLabel>Pages ({fichiers.length}/{PAGES_MAX})</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {fichiers.map((f, i) => (
                  <ApercuLocal key={`${f.name}-${i}`} fichier={f} numero={i + 1}
                    onRetirer={() => setFichiers((prev) => prev.filter((_, j) => j !== i))} />
                ))}
                {fichiers.length < PAGES_MAX && (
                  <>
                    <button type="button" onClick={() => cameraRef.current?.click()}
                      className="w-20 h-24 rounded-lg border-2 border-dashed border-(--color-petrol-100) text-(--color-petrol-600) flex flex-col items-center justify-center gap-1 text-xs font-medium hover:bg-(--color-petrol-50)">
                      <Camera size={20} /> Scanner
                    </button>
                    <button type="button" onClick={() => importRef.current?.click()}
                      className="w-20 h-24 rounded-lg border-2 border-dashed border-(--color-petrol-100) text-(--color-petrol-600) flex flex-col items-center justify-center gap-1 text-xs font-medium hover:bg-(--color-petrol-50)">
                      <Upload size={20} /> Importer
                    </button>
                  </>
                )}
              </div>
              <p className="text-xs text-(--color-ink-600) mt-2">
                « Scanner » ouvre l'appareil photo du téléphone : photographiez chaque page de votre ancien carnet, une par une.
                « Importer » accepte photos et PDF (10 Mo max par fichier).
              </p>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { ajouterFichiers(e.target.files); e.target.value = ''; }} />
              <input ref={importRef} type="file" accept="image/*,application/pdf" multiple className="hidden"
                onChange={(e) => { ajouterFichiers(e.target.files); e.target.value = ''; }} />
            </div>

            {erreur && <p className="text-sm text-(--color-clay-500)">{erreur}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => { setOuvert(false); setFichiers([]); setErreur(null); }}>Annuler</Button>
              <Button type="submit" disabled={envoi}>{envoi ? 'Envoi...' : 'Enregistrer dans mon carnet'}</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Spinner className="w-6 h-6" /></div>
      ) : visibles.length === 0 ? (
        <Card>
          <EmptyState
            icon={FolderHeart}
            title="Aucun document"
            description={peutAjouter
              ? 'Scannez vos anciens carnets et documents médicaux pour que vos médecins aient tout votre historique.'
              : 'Aucun antécédent ni ancien carnet n\'a été ajouté.'}
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {visibles.map((d) => (
            <Card key={d.id} className="p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-(--color-ink-900) truncate">{d.titre}</p>
                  <p className="text-xs font-semibold text-(--color-amber-500)">{TYPES_DOCUMENT[d.type] || d.type}</p>
                </div>
                {d.supprimable && (
                  <button type="button" onClick={() => handleSupprimer(d)} title="Supprimer"
                    className="p-1.5 rounded-lg text-(--color-ink-300) hover:text-(--color-clay-500) hover:bg-(--color-clay-100)">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              {d.description && <p className="text-sm text-(--color-ink-600) line-clamp-3">{d.description}</p>}
              <p className="text-xs text-(--color-ink-300)">
                {d.dateDocument ? `Document du ${formatDate(d.dateDocument)} · ` : ''}
                Ajouté le {formatDate(d.dateAjout)}{d.ajouteParNom ? ` par ${d.ajouteParNom}` : ''}
              </p>
              <Button variant="ghost" className="!justify-start !px-2 !py-1.5 mt-auto" onClick={() => setAffiche(d)}>
                <Eye size={15} /> Voir {d.pages.length > 1 ? `les ${d.pages.length} pages` : 'le document'}
              </Button>
            </Card>
          ))}
        </div>
      )}

      {affiche && <Visionneuse document={affiche} onFermer={fermerVisionneuse} />}
    </section>
  );
}
