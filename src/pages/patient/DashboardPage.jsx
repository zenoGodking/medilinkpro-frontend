import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarHeart, MapPinned, FileHeart, Clock, MapPin, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRendezVousByPatient } from '../../api/rendezVous';
import { Card, Button, Spinner, EmptyState } from '../../components/ui';
import PhotoFacialeCard from '../../components/PhotoFacialeCard';
import NotificationsPushCard from '../../components/NotificationsPushCard';

function formatDateHeure(iso) {
  const d = new Date(iso);
  return {
    jour: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
    heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [rendezVous, setRendezVous] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getRendezVousByPatient(user.userId);
        if (!cancelled) setRendezVous(data);
      } catch {
        if (!cancelled) setRendezVous([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user.userId]);

  const aVenir = rendezVous
    .filter((r) => r.statut !== 'ANNULE' && r.statut !== 'TERMINE' && new Date(r.dateHeure) > new Date())
    .sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));

  const prochain = aVenir[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-(--color-petrol-700)">
          Bonjour {user?.prenom} 👋
        </h1>
        <p className="text-(--color-ink-600) mt-1">Voici un aperçu de votre suivi médical.</p>
      </div>

      <PhotoFacialeCard />
      <NotificationsPushCard raison="Soyez prévenu quand une infirmière arrive et à l'heure de vos médicaments." />

      {/* Signature : carte "prochain rendez-vous" en evidence */}
      {loading ? (
        <Card className="p-8 flex justify-center">
          <Spinner className="w-6 h-6" />
        </Card>
      ) : prochain ? (
        <div className="relative overflow-hidden rounded-2xl bg-(--color-petrol-600) text-white p-6 sm:p-8">
          <div
            className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-(--color-amber-400)/15"
            aria-hidden="true"
          />
          <div
            className="absolute right-16 bottom-0 w-24 h-24 rounded-full bg-white/5"
            aria-hidden="true"
          />
          <p className="relative text-xs uppercase tracking-wider font-semibold text-(--color-amber-400) mb-2">
            Prochain rendez-vous
          </p>
          <h2 className="relative font-display font-bold text-xl sm:text-2xl mb-4 capitalize">
            {formatDateHeure(prochain.dateHeure).jour} a {formatDateHeure(prochain.dateHeure).heure}
          </h2>
          <div className="relative flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
            <span className="flex items-center gap-1.5">
              <Clock size={15} /> Dr {prochain.medecinNomComplet}
            </span>
            {prochain.specialiteMedecin && (
              <span className="flex items-center gap-1.5">
                {prochain.specialiteMedecin}
              </span>
            )}
            {prochain.etablissementNom && (
              <span className="flex items-center gap-1.5">
                <MapPin size={15} /> {prochain.etablissementNom}
              </span>
            )}
          </div>
          <Link
            to="/patient/rendez-vous"
            className="relative inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-(--color-petrol-900) bg-(--color-amber-400) hover:bg-(--color-amber-500) px-4 py-2 rounded-xl transition-colors"
          >
            Voir tous mes rendez-vous <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={CalendarHeart}
            title="Aucun rendez-vous à venir"
            description="Trouvez un spécialiste près de chez vous et prenez rendez-vous en quelques clics."
            action={
              <Link to="/patient/recherche">
                <Button variant="amber">Trouver un spécialiste</Button>
              </Link>
            }
          />
        </Card>
      )}

      {/* Raccourcis */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/patient/dossier">
          <Card className="p-5 h-full hover:border-(--color-petrol-400) transition-colors">
            <div className="w-9 h-9 rounded-lg bg-(--color-sage-100) flex items-center justify-center mb-3">
              <FileHeart size={18} className="text-(--color-sage-500)" />
            </div>
            <h3 className="font-display font-semibold text-(--color-ink-900)">Mon dossier médical</h3>
            <p className="text-sm text-(--color-ink-600) mt-1">Consultations, ordonnances et résultats.</p>
          </Card>
        </Link>

        <Link to="/patient/recherche">
          <Card className="p-5 h-full hover:border-(--color-petrol-400) transition-colors">
            <div className="w-9 h-9 rounded-lg bg-(--color-amber-400)/20 flex items-center justify-center mb-3">
              <MapPinned size={18} className="text-(--color-amber-500)" />
            </div>
            <h3 className="font-display font-semibold text-(--color-ink-900)">Trouver un spécialiste</h3>
            <p className="text-sm text-(--color-ink-600) mt-1">Recherchez par spécialité et proximité.</p>
          </Card>
        </Link>

        <Link to="/patient/rendez-vous">
          <Card className="p-5 h-full hover:border-(--color-petrol-400) transition-colors">
            <div className="w-9 h-9 rounded-lg bg-(--color-petrol-50) flex items-center justify-center mb-3">
              <CalendarHeart size={18} className="text-(--color-petrol-600)" />
            </div>
            <h3 className="font-display font-semibold text-(--color-ink-900)">Mes rendez-vous</h3>
            <p className="text-sm text-(--color-ink-600) mt-1">
              {aVenir.length > 0 ? `${aVenir.length} à venir` : 'Aucun rendez-vous planifié'}
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
