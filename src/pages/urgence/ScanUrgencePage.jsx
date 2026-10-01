import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ScanFace, AlertTriangle, Phone, Droplet, ShieldAlert, FileHeart, Eye, SearchX, ArrowRight, Activity,
} from 'lucide-react';
import { Card, Button, Spinner, PageHeader } from '../../components/ui';
import CapturePhotoVisage from '../../components/CapturePhotoVisage';
import { rechercherParVisage } from '../../api/reconnaissanceFaciale';
import { libelleGroupeSanguin } from '../../utils/groupeSanguin';

const NIVEAU_STYLES = {
  ELEVEE: { label: 'Confiance élevée', classe: 'bg-(--color-sage-100) text-(--color-sage-500)', barre: 'bg-(--color-sage-500)' },
  MOYENNE: { label: 'Confiance moyenne', classe: 'bg-(--color-amber-400)/20 text-(--color-amber-500)', barre: 'bg-(--color-amber-400)' },
  FAIBLE: { label: 'Confiance faible', classe: 'bg-(--color-clay-100) text-(--color-clay-500)', barre: 'bg-(--color-clay-500)' },
};

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString('fr-FR') : null;
}

/**
 * Carte d'un candidat. Les donnees medicales restent masquees tant que l'utilisateur n'a pas
 * compare la photo de reference avec la personne : la correspondance n'est qu'une probabilite.
 */
function CandidatCard({ candidat, photoScannee, carnetAccessible }) {
  const [confirme, setConfirme] = useState(false);
  const niveau = NIVEAU_STYLES[candidat.niveauConfiance];

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-xs uppercase tracking-wider font-semibold text-(--color-ink-600)">
          Correspondance probable n°{candidat.rang}
        </p>
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${niveau.classe}`}>
          {niveau.label}
        </span>
      </div>

      <div className="flex gap-3 mb-4">
        <figure className="flex-1 text-center">
          <img src={photoScannee} alt="Photo scannée" className="w-full aspect-square object-cover rounded-xl border border-(--color-petrol-100)" />
          <figcaption className="text-xs text-(--color-ink-600) mt-1">Photo scannée</figcaption>
        </figure>
        <figure className="flex-1 text-center">
          {candidat.photoReference ? (
            <img src={candidat.photoReference} alt="Photo de référence" className="w-full aspect-square object-cover rounded-xl border border-(--color-petrol-100)" />
          ) : (
            <div className="w-full aspect-square rounded-xl bg-(--color-petrol-50)" />
          )}
          <figcaption className="text-xs text-(--color-ink-600) mt-1">Photo à l'inscription</figcaption>
        </figure>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-(--color-ink-600)">Score de confiance (indicatif)</span>
          <span className="font-semibold text-(--color-petrol-700)">{candidat.scoreConfiance} %</span>
        </div>
        <div className="h-2 rounded-full bg-(--color-petrol-50) overflow-hidden">
          <div className={`h-full ${niveau.barre}`} style={{ width: `${candidat.scoreConfiance}%` }} />
        </div>
      </div>

      {!confirme ? (
        <Button variant="ghost" className="w-full border border-(--color-petrol-100)" onClick={() => setConfirme(true)}>
          <Eye size={16} /> Les photos se ressemblent : afficher les informations
        </Button>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="font-display font-bold text-lg text-(--color-petrol-700)">
              {candidat.prenom} {candidat.nom}
            </p>
            {candidat.dateNaissance && (
              <p className="text-sm text-(--color-ink-600)">Ne(e) le {formatDate(candidat.dateNaissance)}</p>
            )}
          </div>

          {candidat.decede && (
            <p className="text-sm font-semibold text-(--color-ink-600) bg-(--color-petrol-50) rounded-xl px-3 py-2">
              Cette personne est déclarée décédée.
            </p>
          )}

          {candidat.conditionsUrgence && (
            <div className="rounded-xl bg-(--color-clay-100) p-3">
              <p className="flex items-center gap-1 text-xs font-semibold text-(--color-clay-500)"><Activity size={13} /> À signaler aux secours</p>
              <p className="text-sm font-semibold text-(--color-petrol-700) mt-1">{candidat.conditionsUrgence}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-(--color-clay-100) p-3">
              <p className="flex items-center gap-1 text-xs font-semibold text-(--color-clay-500)"><Droplet size={13} /> Groupe sanguin</p>
              <p className="font-display font-bold text-2xl text-(--color-clay-500)">{libelleGroupeSanguin(candidat.groupeSanguin)}</p>
              <p className="text-[11px] text-(--color-clay-500)">À confirmer avant transfusion</p>
            </div>
            <div className="rounded-xl bg-(--color-amber-400)/15 p-3">
              <p className="flex items-center gap-1 text-xs font-semibold text-(--color-amber-500)"><ShieldAlert size={13} /> Allergies</p>
              <p className="text-sm font-semibold text-(--color-petrol-700) mt-1">{candidat.allergies || 'Aucune déclarée'}</p>
            </div>
          </div>

          {candidat.contactUrgenceTelephone ? (
            <a
              href={`tel:${candidat.contactUrgenceTelephone}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-(--color-petrol-600) text-white px-4 py-3 hover:bg-(--color-petrol-700) transition-colors"
            >
              <span>
                <span className="block text-xs text-white/80">Appeler un proche{candidat.contactUrgenceNom ? ` : ${candidat.contactUrgenceNom}` : ''}</span>
                <span className="font-semibold">{candidat.contactUrgenceTelephone}</span>
              </span>
              <Phone size={20} />
            </a>
          ) : (
            <p className="text-sm text-(--color-ink-600)">Aucun contact d'urgence renseigné.</p>
          )}

          {carnetAccessible && (
            <Link to={`/urgence/carnet/${candidat.patientId}`} className="block">
              <Button variant="ghost" className="w-full border border-(--color-petrol-100)">
                <FileHeart size={16} /> Carnet médical complet (lecture seule) <ArrowRight size={15} />
              </Button>
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}

export default function ScanUrgencePage() {
  const [visage, setVisage] = useState(null);
  const [photoScannee, setPhotoScannee] = useState(null);
  const [resultat, setResultat] = useState(null);
  const [recherche, setRecherche] = useState(false);
  const [erreur, setErreur] = useState(null);

  function handleVisage(v) {
    setVisage(v);
    setResultat(null);
    setErreur(null);
    if (photoScannee) URL.revokeObjectURL(photoScannee);
    setPhotoScannee(v ? URL.createObjectURL(v.photo) : null);
  }

  async function lancerRecherche() {
    setRecherche(true);
    setErreur(null);
    try {
      setResultat(await rechercherParVisage(visage.descripteur));
    } catch (err) {
      setErreur(err.response?.data?.message || 'La recherche a échoué. Réessayez.');
    } finally {
      setRecherche(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Identification d'urgence"
        description="Scannez le visage d'une personne accidentée pour retrouver les informations utiles aux secours."
      />

      <div className="flex items-start gap-2 bg-(--color-amber-400)/15 text-(--color-amber-500) text-sm rounded-xl px-4 py-3">
        <AlertTriangle size={17} className="mt-0.5 shrink-0" />
        <span>
          La reconnaissance faciale n'est pas fiable à 100 %. Les résultats sont des <strong>correspondances probables</strong>,
          jamais une identification certaine. Appelez d'abord les secours si ce n'est pas déjà fait.
        </span>
      </div>

      <p className="text-sm text-(--color-ink-600)">
        La personne a une <strong>carte d'urgence</strong> (QR code sur son écran verrouillé ou dans son portefeuille) ?
        Scannez-la simplement avec l'appareil photo de votre téléphone : c'est plus fiable que la reconnaissance faciale.
      </p>

      <Card className="p-5 space-y-4">
        <CapturePhotoVisage
          onResultat={handleVisage}
          visageUnique={false}
          capture="environment"
          libelle="Scanner le visage de la personne"
        />
        <Button onClick={lancerRecherche} disabled={!visage || recherche} className="w-full">
          {recherche ? <Spinner className="w-4 h-4" /> : <ScanFace size={17} />}
          {recherche ? 'Recherche en cours...' : 'Rechercher une correspondance'}
        </Button>
        {erreur && <p className="text-sm text-(--color-clay-500)">{erreur}</p>}
      </Card>

      {resultat && (
        resultat.candidats.length === 0 ? (
          <Card className="p-6 text-center">
            <SearchX size={28} className="mx-auto text-(--color-ink-600) mb-2" />
            <p className="font-semibold text-(--color-petrol-700)">Aucune correspondance plausible</p>
            <p className="text-sm text-(--color-ink-600) mt-1">{resultat.avertissement}</p>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-(--color-ink-600)">{resultat.avertissement}</p>
            {resultat.ambigu && (
              <div className="flex items-start gap-2 bg-(--color-clay-100) text-(--color-clay-500) text-sm rounded-xl px-4 py-3">
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                <span>Plusieurs personnes ressemblent autant au visage scanné : impossible de les départager avec certitude.</span>
              </div>
            )}
            {resultat.candidats.map((c) => (
              <CandidatCard
                key={c.patientId}
                candidat={c}
                photoScannee={photoScannee}
                carnetAccessible={resultat.niveauAcces === 'COMPLET'}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
