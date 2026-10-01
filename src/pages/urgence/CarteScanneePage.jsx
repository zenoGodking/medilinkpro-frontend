import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Phone, Droplet, ShieldAlert, Activity, FileHeart, QrCode, ArrowRight } from 'lucide-react';
import { scannerCarteUrgence } from '../../api/carteUrgence';
import { libelleGroupeSanguin } from '../../utils/groupeSanguin';
import { Card, Button, Spinner, PageHeader, EmptyState } from '../../components/ui';

/** Page ouverte en scannant le QR code de la carte d'urgence d'un patient. */
export default function CarteScanneePage() {
  const { jeton } = useParams();
  const [carte, setCarte] = useState(null);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    scannerCarteUrgence(jeton)
      .then(setCarte)
      .catch((err) => setErreur(err.response?.status === 404
        ? "Cette carte d'urgence n'existe pas ou a été remplacée par son propriétaire."
        : 'Impossible de lire cette carte pour le moment.'));
  }, [jeton]);

  if (erreur) return <EmptyState icon={QrCode} title="Carte illisible" description={erreur} />;
  if (!carte) return <div className="flex justify-center py-20"><Spinner className="w-7 h-7" /></div>;

  return (
    <div className="space-y-5 max-w-xl">
      <PageHeader
        title={`Carte d'urgence de ${carte.prenom}${carte.nom ? ` ${carte.nom}` : ''}`}
        description="Comparez la photo avec la personne avant d'utiliser ces informations."
      />

      <Card className="p-5 space-y-4">
        <div className="flex gap-4 items-center">
          {carte.photoReference && (
            <img src={carte.photoReference} alt="Photo du titulaire" className="w-24 h-24 rounded-xl object-cover border border-(--color-petrol-100)" />
          )}
          <div className="text-sm text-(--color-ink-600)">
            <p className="font-display font-bold text-lg text-(--color-petrol-700)">{carte.prenom} {carte.nom}</p>
            {carte.dateNaissance && <p>Ne(e) le {new Date(carte.dateNaissance).toLocaleDateString('fr-FR')}</p>}
            {carte.decede && <p className="font-semibold">Personne déclarée décédée.</p>}
          </div>
        </div>

        {carte.conditionsUrgence && (
          <div className="rounded-xl bg-(--color-clay-100) p-3">
            <p className="flex items-center gap-1 text-xs font-semibold text-(--color-clay-500)"><Activity size={13} /> À signaler aux secours</p>
            <p className="text-sm font-semibold text-(--color-petrol-700) mt-1">{carte.conditionsUrgence}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-(--color-clay-100) p-3">
            <p className="flex items-center gap-1 text-xs font-semibold text-(--color-clay-500)"><Droplet size={13} /> Groupe sanguin</p>
            <p className="font-display font-bold text-2xl text-(--color-clay-500)">{libelleGroupeSanguin(carte.groupeSanguin)}</p>
            <p className="text-[11px] text-(--color-clay-500)">À confirmer avant transfusion</p>
          </div>
          <div className="rounded-xl bg-(--color-amber-400)/15 p-3">
            <p className="flex items-center gap-1 text-xs font-semibold text-(--color-amber-500)"><ShieldAlert size={13} /> Allergies</p>
            <p className="text-sm font-semibold text-(--color-petrol-700) mt-1">{carte.allergies || 'Aucune déclarée'}</p>
          </div>
        </div>

        {carte.contactUrgenceTelephone ? (
          <a
            href={`tel:${carte.contactUrgenceTelephone}`}
            className="flex items-center justify-between gap-3 rounded-xl bg-(--color-petrol-600) text-white px-4 py-3 hover:bg-(--color-petrol-700) transition-colors"
          >
            <span>
              <span className="block text-xs text-white/80">Appeler un proche{carte.contactUrgenceNom ? ` : ${carte.contactUrgenceNom}` : ''}</span>
              <span className="font-semibold">{carte.contactUrgenceTelephone}</span>
            </span>
            <Phone size={20} />
          </a>
        ) : (
          <p className="text-sm text-(--color-ink-600)">Aucun contact d'urgence renseigné.</p>
        )}

        {carte.patientId && (
          <Link to={`/urgence/carnet/${carte.patientId}`} className="block">
            <Button variant="ghost" className="w-full border border-(--color-petrol-100)">
              <FileHeart size={16} /> Carnet médical complet (lecture seule) <ArrowRight size={15} />
            </Button>
          </Link>
        )}
      </Card>
    </div>
  );
}
