import { useEffect, useRef, useState } from 'react';
import {
  Building2, MapPin, Phone, Plus, X, Pencil, Trash2, ImagePlus, ImageOff,
  Megaphone, ChevronDown, ChevronUp, Ban, Stethoscope, Send,
} from 'lucide-react';
import {
  getAllEtablissements, createEtablissement, updateEtablissement, deleteEtablissement,
  uploadEtablissementPhotos, deleteEtablissementPhoto,
} from '../api/etablissements';
import {
  creerCampagne, getCampagnesEtablissement, desactiverCampagne, supprimerCampagne,
} from '../api/campagnes';
import { getAllMedecins } from '../api/medecins';
import { inviterMedecin, getDemandesEtablissement } from '../api/integration';
import { resolveMediaUrl } from '../api/client';
import { getTousLesUtilisateurs, attribuerDirecteur } from '../api/admin';
import {
  Card, Button, Spinner, EmptyState, PageHeader, FieldLabel, TextInput, Textarea, Select,
} from './ui';

const INITIAL_FORM = { nom: '', type: '', adresse: '', telephone: '', ville: '', quartier: '', specialitesDisponibles: '' };
const INITIAL_CAMPAGNE_FORM = { titre: '', description: '', dateDebut: '', dateFin: '' };

/**
 * Gestion CRUD des etablissements de sante, partagee entre les espaces Directeur et Admin.
 * Un directeur ne voit et ne gere que ses etablissements (chargerEtablissements) ;
 * l'admin voit tout et attribue le directeur responsable de chaque etablissement (modeAdmin).
 * Inclut la gestion des photos affichees dans le carousel de la page d'accueil.
 */
export default function EtablissementsManager({ description, chargerEtablissements = getAllEtablissements, modeAdmin = false }) {
  const [directeurs, setDirecteurs] = useState([]);
  const [attributionErreur, setAttributionErreur] = useState({});
  const [etablissements, setEtablissements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [photoError, setPhotoError] = useState({});
  const fileInputRefs = useRef({});

  const [campagnesOuvertes, setCampagnesOuvertes] = useState({});
  const [campagnesParEtab, setCampagnesParEtab] = useState({});
  const [campagneForm, setCampagneForm] = useState({});
  const [campagneSubmitting, setCampagneSubmitting] = useState(null);
  const [campagneErreur, setCampagneErreur] = useState({});

  const [medecinsOuvert, setMedecinsOuvert] = useState({});
  const [tousLesMedecins, setTousLesMedecins] = useState([]);
  const [demandesParEtab, setDemandesParEtab] = useState({});
  const [medecinChoisi, setMedecinChoisi] = useState({});
  const [inviteSubmitting, setInviteSubmitting] = useState(null);
  const [inviteErreur, setInviteErreur] = useState({});

  async function load() {
    setLoading(true);
    try {
      const data = await chargerEtablissements();
      setEtablissements(data);
      if (modeAdmin) setDirecteurs(await getTousLesUtilisateurs('DIRECTEUR'));
    } catch {
      setEtablissements([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAttribuerDirecteur(etablissementId, directeurId) {
    setAttributionErreur((prev) => ({ ...prev, [etablissementId]: null }));
    try {
      const maj = await attribuerDirecteur(etablissementId, directeurId || null);
      setEtablissements((prev) => prev.map((e) => (e.id === etablissementId ? maj : e)));
    } catch (err) {
      setAttributionErreur((prev) => ({ ...prev, [etablissementId]: err.response?.data?.message || "Attribution impossible." }));
    }
  }

  function startCreate() {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setShowForm(true);
  }

  function startEdit(e) {
    setEditingId(e.id);
    setForm({
      nom: e.nom || '',
      type: e.type || '',
      adresse: e.adresse || '',
      telephone: e.telephone || '',
      ville: e.ville || '',
      quartier: e.quartier || '',
      specialitesDisponibles: (e.specialitesDisponibles || []).join(', '),
    });
    setShowForm(true);
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        nom: form.nom,
        type: form.type || null,
        adresse: form.adresse || null,
        telephone: form.telephone || null,
        ville: form.ville || null,
        quartier: form.quartier || null,
        specialitesDisponibles: form.specialitesDisponibles
          ? form.specialitesDisponibles.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      if (editingId) {
        await updateEtablissement(editingId, payload);
      } else {
        await createEtablissement(payload);
      }
      setShowForm(false);
      setForm(INITIAL_FORM);
      setEditingId(null);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    await deleteEtablissement(id);
    await load();
  }

  function triggerFileSelect(id) {
    fileInputRefs.current[id]?.click();
  }

  async function handlePhotosSelected(id, fileList) {
    if (!fileList || fileList.length === 0) return;
    setPhotoError((prev) => ({ ...prev, [id]: null }));
    setUploadingId(id);
    try {
      const updated = await uploadEtablissementPhotos(id, fileList);
      setEtablissements((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch {
      setPhotoError((prev) => ({ ...prev, [id]: "Echec de l'envoi des photos. Verifiez le format (jpg, png, webp) et la taille (5 Mo max)." }));
    } finally {
      setUploadingId(null);
      if (fileInputRefs.current[id]) fileInputRefs.current[id].value = '';
    }
  }

  async function handleDeletePhoto(id, url) {
    setUploadingId(id);
    try {
      const updated = await deleteEtablissementPhoto(id, url);
      setEtablissements((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } finally {
      setUploadingId(null);
    }
  }

  async function toggleCampagnes(id) {
    const estOuvert = campagnesOuvertes[id];
    setCampagnesOuvertes((prev) => ({ ...prev, [id]: !estOuvert }));
    if (!estOuvert && !campagnesParEtab[id]) {
      try {
        const data = await getCampagnesEtablissement(id);
        setCampagnesParEtab((prev) => ({ ...prev, [id]: data }));
      } catch {
        setCampagnesParEtab((prev) => ({ ...prev, [id]: [] }));
      }
    }
  }

  function updateCampagneForm(id, field, value) {
    setCampagneForm((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || INITIAL_CAMPAGNE_FORM), [field]: value },
    }));
  }

  async function handleCreerCampagne(id) {
    const form = campagneForm[id] || INITIAL_CAMPAGNE_FORM;
    if (!form.titre?.trim() || !form.dateDebut) return;
    setCampagneSubmitting(id);
    setCampagneErreur((prev) => ({ ...prev, [id]: null }));
    try {
      const nouvelle = await creerCampagne(id, {
        titre: form.titre,
        description: form.description || null,
        dateDebut: form.dateDebut,
        dateFin: form.dateFin || null,
      });
      setCampagnesParEtab((prev) => ({ ...prev, [id]: [nouvelle, ...(prev[id] || [])] }));
      setCampagneForm((prev) => ({ ...prev, [id]: INITIAL_CAMPAGNE_FORM }));
    } catch {
      setCampagneErreur((prev) => ({ ...prev, [id]: 'Impossible de creer la campagne. Verifiez les champs.' }));
    } finally {
      setCampagneSubmitting(null);
    }
  }

  async function handleDesactiverCampagne(etabId, campagneId) {
    const maj = await desactiverCampagne(campagneId);
    setCampagnesParEtab((prev) => ({
      ...prev,
      [etabId]: (prev[etabId] || []).map((c) => (c.id === campagneId ? maj : c)),
    }));
  }

  async function handleSupprimerCampagne(etabId, campagneId) {
    await supprimerCampagne(campagneId);
    setCampagnesParEtab((prev) => ({
      ...prev,
      [etabId]: (prev[etabId] || []).filter((c) => c.id !== campagneId),
    }));
  }

  async function toggleMedecins(id) {
    const estOuvert = medecinsOuvert[id];
    setMedecinsOuvert((prev) => ({ ...prev, [id]: !estOuvert }));
    if (!estOuvert) {
      try {
        if (tousLesMedecins.length === 0) {
          const data = await getAllMedecins();
          setTousLesMedecins(data);
        }
        const demandes = await getDemandesEtablissement(id);
        setDemandesParEtab((prev) => ({ ...prev, [id]: demandes }));
      } catch {
        setDemandesParEtab((prev) => ({ ...prev, [id]: [] }));
      }
    }
  }

  async function handleInviterMedecin(etabId) {
    const medecinId = medecinChoisi[etabId];
    if (!medecinId) return;
    setInviteSubmitting(etabId);
    setInviteErreur((prev) => ({ ...prev, [etabId]: null }));
    try {
      const nouvelle = await inviterMedecin(etabId, medecinId);
      setDemandesParEtab((prev) => ({ ...prev, [etabId]: [nouvelle, ...(prev[etabId] || [])] }));
      setMedecinChoisi((prev) => ({ ...prev, [etabId]: '' }));
    } catch {
      setInviteErreur((prev) => ({ ...prev, [etabId]: 'Impossible d\'envoyer cette invitation (deja envoyee ou medecin deja membre).' }));
    } finally {
      setInviteSubmitting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="w-7 h-7" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Etablissements"
        description={description || "Gerez les hopitaux et cliniques de votre reseau."}
        action={
          <Button variant="amber" onClick={showForm ? () => setShowForm(false) : startCreate}>
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Annuler' : 'Ajouter un etablissement'}
          </Button>
        }
      />

      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <FieldLabel>Nom</FieldLabel>
              <TextInput required value={form.nom} onChange={(e) => update('nom', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Type</FieldLabel>
                <TextInput placeholder="Hopital, clinique..." value={form.type} onChange={(e) => update('type', e.target.value)} />
              </div>
              <div>
                <FieldLabel>Telephone</FieldLabel>
                <TextInput value={form.telephone} onChange={(e) => update('telephone', e.target.value)} />
              </div>
            </div>
            <div>
              <FieldLabel>Adresse</FieldLabel>
              <TextInput value={form.adresse} onChange={(e) => update('adresse', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Ville</FieldLabel>
                <TextInput placeholder="Yaounde" value={form.ville} onChange={(e) => update('ville', e.target.value)} />
              </div>
              <div>
                <FieldLabel>Quartier</FieldLabel>
                <TextInput placeholder="Bastos" value={form.quartier} onChange={(e) => update('quartier', e.target.value)} />
              </div>
            </div>
            <div>
              <FieldLabel>Specialites disponibles</FieldLabel>
              <TextInput
                placeholder="Cardiologie, pediatrie, dermatologie..."
                value={form.specialitesDisponibles}
                onChange={(e) => update('specialitesDisponibles', e.target.value)}
              />
              <p className="text-xs text-(--color-ink-300) mt-1">Separees par des virgules.</p>
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Enregistrement...' : editingId ? 'Mettre a jour' : "Creer l'etablissement"}
            </Button>
            {!editingId && (
              <p className="text-xs text-(--color-ink-300) text-center">
                Vous pourrez ajouter des photos juste apres la creation, depuis la fiche de l'etablissement.
              </p>
            )}
          </form>
        </Card>
      )}

      {etablissements.length === 0 ? (
        <Card>
          <EmptyState icon={Building2} title="Aucun etablissement" description="Ajoutez votre premier etablissement de sante." />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {etablissements.map((e) => (
            <Card key={e.id} className="overflow-hidden">
              {/* Bandeau photos : apercu horizontal + ajout/suppression */}
              <div className="relative h-36 bg-(--color-petrol-50) flex items-center gap-2 overflow-x-auto px-3 py-3">
                {(e.photos || []).map((url) => (
                  <div key={url} className="relative shrink-0 h-full aspect-[4/3] rounded-xl overflow-hidden group">
                    <img src={resolveMediaUrl(url)} alt={e.nom} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(e.id, url)}
                      disabled={uploadingId === e.id}
                      className="absolute top-1 right-1 p-1 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Supprimer la photo"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => triggerFileSelect(e.id)}
                  disabled={uploadingId === e.id}
                  className="shrink-0 h-full aspect-[4/3] rounded-xl border-2 border-dashed border-(--color-petrol-200) flex flex-col items-center justify-center gap-1 text-(--color-petrol-500) hover:bg-white/60 transition-colors disabled:opacity-50"
                >
                  {uploadingId === e.id ? <Spinner className="w-5 h-5" /> : <ImagePlus size={20} />}
                  <span className="text-[11px] font-medium">Ajouter</span>
                </button>
                <input
                  ref={(el) => { fileInputRefs.current[e.id] = el; }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  hidden
                  onChange={(ev) => handlePhotosSelected(e.id, ev.target.files)}
                />

                {(e.photos || []).length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-(--color-ink-300) gap-1.5 text-xs">
                    <ImageOff size={14} /> Aucune photo pour le carousel
                  </div>
                )}
              </div>
              {photoError[e.id] && (
                <p className="text-xs text-(--color-clay-500) px-5 pt-2">{photoError[e.id]}</p>
              )}

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-semibold text-(--color-ink-900)">{e.nom}</p>
                    {e.type && <p className="text-sm text-(--color-amber-500) font-medium">{e.type}</p>}
                    {modeAdmin && (
                      <div className="mt-2">
                        <label className="text-xs text-(--color-ink-600)">Directeur responsable</label>
                        <Select value={e.directeurId || ''} onChange={(ev) => handleAttribuerDirecteur(e.id, ev.target.value)}>
                          <option value="">Aucun directeur</option>
                          {directeurs.map((d) => (
                            <option key={d.id} value={d.id}>{d.prenom} {d.nom}</option>
                          ))}
                        </Select>
                        {attributionErreur[e.id] && <p className="text-xs text-(--color-clay-500) mt-1">{attributionErreur[e.id]}</p>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEdit(e)} className="p-2 rounded-lg hover:bg-(--color-petrol-50) text-(--color-petrol-600)">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(e.id)} className="p-2 rounded-lg hover:bg-(--color-clay-100) text-(--color-clay-500)">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm text-(--color-ink-600)">
                  {e.adresse && <p className="flex items-center gap-1.5"><MapPin size={14} /> {e.adresse}</p>}
                  {(e.ville || e.quartier) && (
                    <p className="flex items-center gap-1.5"><MapPin size={14} /> {[e.quartier, e.ville].filter(Boolean).join(', ')}</p>
                  )}
                  {e.telephone && <p className="flex items-center gap-1.5"><Phone size={14} /> {e.telephone}</p>}
                </div>
                {e.specialitesDisponibles?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {e.specialitesDisponibles.map((s) => (
                      <span key={s} className="text-xs font-medium px-2 py-1 rounded-full bg-(--color-petrol-50) text-(--color-petrol-600)">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => toggleCampagnes(e.id)}
                  className="w-full flex items-center justify-between gap-2 text-sm font-semibold text-(--color-clay-500) mt-4 pt-4 border-t border-(--color-petrol-100)"
                >
                  <span className="flex items-center gap-1.5"><Megaphone size={15} /> Campagnes</span>
                  {campagnesOuvertes[e.id] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {campagnesOuvertes[e.id] && (
                  <div className="mt-3 space-y-3">
                    {(campagnesParEtab[e.id] || []).map((c) => (
                      <div key={c.id} className="bg-(--color-petrol-50)/60 rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-(--color-ink-900)">{c.titre}</p>
                            {c.description && <p className="text-xs text-(--color-ink-600) mt-0.5">{c.description}</p>}
                            <p className="text-[11px] text-(--color-ink-300) mt-1">
                              {c.dateDebut}{c.dateFin ? ` -> ${c.dateFin}` : ' (sans date de fin)'}
                            </p>
                          </div>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                            c.active ? 'bg-(--color-sage-100) text-(--color-sage-500)' : 'bg-(--color-petrol-100) text-(--color-ink-300)'
                          }`}>
                            {c.active ? 'Active' : c.actif ? 'A venir/expiree' : 'Arretee'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          {c.actif && (
                            <button
                              type="button"
                              onClick={() => handleDesactiverCampagne(e.id, c.id)}
                              className="flex items-center gap-1 text-xs text-(--color-ink-300) hover:text-(--color-clay-500)"
                            >
                              <Ban size={12} /> Arreter
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleSupprimerCampagne(e.id, c.id)}
                            className="flex items-center gap-1 text-xs text-(--color-ink-300) hover:text-(--color-clay-500)"
                          >
                            <Trash2 size={12} /> Supprimer
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="bg-white border border-dashed border-(--color-petrol-200) rounded-xl p-3 space-y-2">
                      <TextInput
                        placeholder="Titre de la campagne (ex: Vaccination gratuite)"
                        value={campagneForm[e.id]?.titre || ''}
                        onChange={(ev) => updateCampagneForm(e.id, 'titre', ev.target.value)}
                      />
                      <Textarea
                        rows={2}
                        placeholder="Description (optionnel)"
                        value={campagneForm[e.id]?.description || ''}
                        onChange={(ev) => updateCampagneForm(e.id, 'description', ev.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <FieldLabel>Debut</FieldLabel>
                          <TextInput
                            type="date"
                            value={campagneForm[e.id]?.dateDebut || ''}
                            onChange={(ev) => updateCampagneForm(e.id, 'dateDebut', ev.target.value)}
                          />
                        </div>
                        <div>
                          <FieldLabel>Fin (optionnel)</FieldLabel>
                          <TextInput
                            type="date"
                            value={campagneForm[e.id]?.dateFin || ''}
                            onChange={(ev) => updateCampagneForm(e.id, 'dateFin', ev.target.value)}
                          />
                        </div>
                      </div>
                      {campagneErreur[e.id] && (
                        <p className="text-xs text-(--color-clay-500)">{campagneErreur[e.id]}</p>
                      )}
                      <Button
                        variant="ghost"
                        className="w-full !py-2"
                        disabled={campagneSubmitting === e.id || !campagneForm[e.id]?.titre?.trim() || !campagneForm[e.id]?.dateDebut}
                        onClick={() => handleCreerCampagne(e.id)}
                      >
                        <Plus size={14} /> {campagneSubmitting === e.id ? 'Envoi...' : 'Lancer la campagne'}
                      </Button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => toggleMedecins(e.id)}
                  className="w-full flex items-center justify-between gap-2 text-sm font-semibold text-(--color-petrol-600) mt-3 pt-3 border-t border-(--color-petrol-100)"
                >
                  <span className="flex items-center gap-1.5"><Stethoscope size={15} /> Medecins de l'etablissement</span>
                  {medecinsOuvert[e.id] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {medecinsOuvert[e.id] && (
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {tousLesMedecins.filter((m) => m.etablissementId === e.id).length === 0 ? (
                        <p className="text-xs text-(--color-ink-300)">Aucun medecin rattache pour l'instant.</p>
                      ) : (
                        tousLesMedecins.filter((m) => m.etablissementId === e.id).map((m) => (
                          <span key={m.id} className="text-xs font-medium px-2.5 py-1 rounded-full bg-(--color-sage-100) text-(--color-sage-500)">
                            Dr {m.prenom} {m.nom}
                          </span>
                        ))
                      )}
                    </div>

                    {(demandesParEtab[e.id] || []).filter((d) => d.statut === 'EN_ATTENTE').length > 0 && (
                      <div className="space-y-1.5">
                        {(demandesParEtab[e.id] || []).filter((d) => d.statut === 'EN_ATTENTE').map((d) => (
                          <p key={d.id} className="text-xs text-(--color-amber-500) bg-(--color-amber-400)/10 rounded-lg px-2.5 py-1.5">
                            {d.initiateur === 'ETABLISSEMENT' ? 'Invitation envoyee a' : 'Demande recue de'} Dr {d.medecinPrenom} {d.medecinNom} - en attente
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Select
                          value={medecinChoisi[e.id] || ''}
                          onChange={(ev) => setMedecinChoisi((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                        >
                          <option value="">Choisir un medecin a inviter...</option>
                          {tousLesMedecins.filter((m) => m.etablissementId !== e.id).map((m) => (
                            <option key={m.id} value={m.id}>Dr {m.prenom} {m.nom} - {m.specialite || 'Generaliste'}</option>
                          ))}
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        className="!px-3 shrink-0"
                        disabled={!medecinChoisi[e.id] || inviteSubmitting === e.id}
                        onClick={() => handleInviterMedecin(e.id)}
                      >
                        <Send size={14} />
                      </Button>
                    </div>
                    {inviteErreur[e.id] && (
                      <p className="text-xs text-(--color-clay-500)">{inviteErreur[e.id]}</p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
