import { useEffect, useState } from 'react';
import { Building2, Send, CheckCircle2, Camera, Star, Clock, X } from 'lucide-react';
import {
  getMonProfilInfirmier, changerPhotoInfirmier, demanderIntegrationInfirmier, getMesDemandesInfirmier,
} from '../../api/infirmiers';
import { getAllEtablissements } from '../../api/etablissements';
import { Card, Button, Spinner, PageHeader, FieldLabel, Select, Textarea } from '../../components/ui';
import PhotoInfirmier from '../../components/PhotoInfirmier';
import CapturePhotoVisage from '../../components/CapturePhotoVisage';

const STATUTS = {
  EN_ATTENTE: { libelle: 'En attente du directeur', classe: 'bg-(--color-amber-400)/20 text-(--color-amber-500)' },
  ACCEPTEE: { libelle: 'Acceptée', classe: 'bg-(--color-sage-100) text-(--color-sage-500)' },
  REFUSEE: { libelle: 'Refusée', classe: 'bg-(--color-clay-100) text-(--color-clay-500)' },
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Profil de l'infirmiere : photo (obligatoire pour accepter les alertes, montree au patient),
 * etablissement de rattachement et demandes d'adhesion aux etablissements.
 */
export default function InfirmierProfilPage() {
  const [profil, setProfil] = useState(null);
  const [demandes, setDemandes] = useState([]);
  const [etablissements, setEtablissements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [versionPhoto, setVersionPhoto] = useState(0);
  const [changementPhoto, setChangementPhoto] = useState(false);
  const [nouvellePhoto, setNouvellePhoto] = useState(null);
  const [envoiPhoto, setEnvoiPhoto] = useState(false);
  const [etablissementChoisi, setEtablissementChoisi] = useState('');
  const [message, setMessage] = useState('');
  const [envoiDemande, setEnvoiDemande] = useState(false);
  const [retour, setRetour] = useState(null);

  useEffect(() => {
    let annule = false;
    Promise.all([getMonProfilInfirmier(), getMesDemandesInfirmier(), getAllEtablissements()])
      .then(([p, d, e]) => {
        if (annule) return;
        setProfil(p);
        setDemandes(d);
        setEtablissements(e);
      })
      .finally(() => { if (!annule) setLoading(false); });
    return () => { annule = true; };
  }, []);

  async function enregistrerPhoto() {
    if (!nouvellePhoto) return;
    setEnvoiPhoto(true);
    setRetour(null);
    try {
      setProfil(await changerPhotoInfirmier(nouvellePhoto.photo));
      setVersionPhoto((v) => v + 1);
      setChangementPhoto(false);
      setNouvellePhoto(null);
      setRetour({ ok: true, texte: 'Photo enregistrée.' });
    } catch (err) {
      setRetour({ ok: false, texte: err.response?.data?.message || "La photo n'a pas pu être enregistrée." });
    } finally {
      setEnvoiPhoto(false);
    }
  }

  async function envoyerDemande(e) {
    e.preventDefault();
    setEnvoiDemande(true);
    setRetour(null);
    try {
      const d = await demanderIntegrationInfirmier(etablissementChoisi, message);
      setDemandes((prev) => [d, ...prev]);
      setEtablissementChoisi('');
      setMessage('');
      setRetour({ ok: true, texte: `Demande envoyée au directeur de ${d.etablissementNom}.` });
    } catch (err) {
      setRetour({ ok: false, texte: err.response?.data?.message || "La demande n'a pas pu être envoyée." });
    } finally {
      setEnvoiDemande(false);
    }
  }

  if (loading || !profil) {
    return <div className="flex justify-center py-20"><Spinner className="w-7 h-7" /></div>;
  }

  const enAttente = new Set(demandes.filter((d) => d.statut === 'EN_ATTENTE').map((d) => d.etablissementId));
  const choix = etablissements.filter((e) => e.id !== profil.etablissementId && !enAttente.has(e.id));

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Mon profil" description="Ce que voit le patient lorsque vous acceptez sa demande de soins." />

      {retour && (
        <p className={`text-sm rounded-xl px-4 py-3 ${retour.ok ? 'bg-(--color-sage-100) text-(--color-sage-500)' : 'bg-(--color-clay-100) text-(--color-clay-500)'}`}>
          {retour.texte}
        </p>
      )}

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <PhotoInfirmier infirmierId={profil.id} disponible={profil.photoDisponible} version={versionPhoto} className="w-28 h-28" />
          <div className="flex-1 space-y-1">
            <p className="font-display font-semibold text-xl text-(--color-ink-900)">{profil.prenom} {profil.nom}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-(--color-ink-600)">
              {profil.nombreAvis > 0 && (
                <span className="flex items-center gap-1">
                  <Star size={14} className="fill-(--color-amber-400) text-(--color-amber-400)" /> {profil.noteMoyenne?.toFixed(1)} ({profil.nombreAvis} avis)
                </span>
              )}
              <span>{profil.nombreInterventions} intervention(s)</span>
              <span className="flex items-center gap-1"><Building2 size={14} /> {profil.etablissementNom || 'Aucun établissement'}</span>
            </div>
            {!profil.photoDisponible && (
              <p className="text-sm text-(--color-clay-500) font-medium pt-1">
                Photo manquante : vous ne pouvez pas accepter d'alerte tant qu'elle n'est pas ajoutée.
              </p>
            )}
          </div>
          {!changementPhoto && (
            <Button variant={profil.photoDisponible ? 'ghost' : 'amber'} onClick={() => setChangementPhoto(true)}>
              <Camera size={15} /> {profil.photoDisponible ? 'Changer' : 'Ajouter ma photo'}
            </Button>
          )}
        </div>

        {changementPhoto && (
          <div className="mt-5 pt-5 border-t border-(--color-petrol-100) space-y-3">
            <FieldLabel>Photo de face, visage bien visible</FieldLabel>
            <CapturePhotoVisage onResultat={setNouvellePhoto} libelle="Prendre ou choisir ma photo" />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setChangementPhoto(false); setNouvellePhoto(null); }}><X size={15} /> Annuler</Button>
              <Button disabled={!nouvellePhoto || envoiPhoto} onClick={enregistrerPhoto}>
                <CheckCircle2 size={15} /> {envoiPhoto ? 'Enregistrement...' : 'Enregistrer la photo'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <section className="space-y-3">
        <h2 className="font-display font-semibold text-lg text-(--color-ink-900) flex items-center gap-2">
          <Building2 size={19} className="text-(--color-petrol-600)" /> Rejoindre un établissement
        </h2>
        <Card className="p-5">
          <form onSubmit={envoyerDemande} className="space-y-3">
            <div>
              <FieldLabel>Établissement</FieldLabel>
              <Select required value={etablissementChoisi} onChange={(e) => setEtablissementChoisi(e.target.value)}>
                <option value="">Choisir un hôpital ou une clinique...</option>
                {choix.map((e) => (
                  <option key={e.id} value={e.id}>{e.nom}{e.ville ? ` - ${e.ville}` : ''}</option>
                ))}
              </Select>
            </div>
            <div>
              <FieldLabel>Message au directeur (optionnel)</FieldLabel>
              <Textarea rows={3} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Expérience, disponibilités, spécialisation (pédiatrie, soins palliatifs...)" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={!etablissementChoisi || envoiDemande}>
                <Send size={15} /> {envoiDemande ? 'Envoi...' : 'Envoyer ma demande'}
              </Button>
            </div>
          </form>
        </Card>

        {demandes.length > 0 && (
          <div className="space-y-2">
            {demandes.map((d) => (
              <Card key={d.id} className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-medium text-(--color-ink-900)">{d.etablissementNom}</p>
                  <p className="text-xs text-(--color-ink-600) flex items-center gap-1">
                    <Clock size={12} /> Envoyée le {formatDate(d.dateCreation)}
                    {d.messageReponse ? ` · « ${d.messageReponse} »` : ''}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUTS[d.statut]?.classe}`}>{STATUTS[d.statut]?.libelle}</span>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
