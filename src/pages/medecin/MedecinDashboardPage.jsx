import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarHeart, Users, FileText, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRendezVousByMedecin } from '../../api/rendezVous';
import { Card, Spinner, EmptyState, Button } from '../../components/ui';

function formatDateHeure(iso) {
  const d = new Date(iso);
  return {
    jour: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
    heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function MedecinDashboardPage() {
  const { user } = useAuth();
  const [rendezVous, setRendezVous] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getRendezVousByMedecin(user.userId);
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
          Bonjour Dr {user?.prenom} 👋
        </h1>
        <p className="text-(--color-ink-600) mt-1">Voici un aperçu de votre activité.</p>
      </div>

      {loading ? (
        <Card className="p-8 flex justify-center">
          <Spinner className="w-6 h-6" />
        </Card>
      ) : prochain ? (
        <div className="relative overflow-hidden rounded-2xl bg-(--color-petrol-600) text-white p-6 sm:p-8">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-(--color-amber-400)/15" aria-hidden="true" />
          <p className="relative text-xs uppercase tracking-wider font-semibold text-(--color-amber-400) mb-2">
            Prochain rendez-vous
          </p>
          <h2 className="relative font-display font-bold text-xl sm:text-2xl mb-4 capitalize">
            {formatDateHeure(prochain.dateHeure).jour} a {formatDateHeure(prochain.dateHeure).heure}
          </h2>
          <div className="relative flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
            <span className="flex items-center gap-1.5">
              <Clock size={15} /> {prochain.patientNomComplet}
            </span>
          </div>
          <Link
            to="/medecin/agenda"
            className="relative inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-(--color-petrol-900) bg-(--color-amber-400) hover:bg-(--color-amber-500) px-4 py-2 rounded-xl transition-colors"
          >
            Voir mon agenda <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={CalendarHeart}
            title="Aucun rendez-vous à venir"
            description="Vos prochains rendez-vous patients apparaîtront ici."
          />
        </Card>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/medecin/agenda">
          <Card className="p-5 h-full hover:border-(--color-petrol-400) transition-colors">
            <div className="w-9 h-9 rounded-lg bg-(--color-petrol-50) flex items-center justify-center mb-3">
              <CalendarHeart size={18} className="text-(--color-petrol-600)" />
            </div>
            <h3 className="font-display font-semibold text-(--color-ink-900)">Mon agenda</h3>
            <p className="text-sm text-(--color-ink-600) mt-1">
              {aVenir.length > 0 ? `${aVenir.length} à venir` : 'Aucun rendez-vous planifié'}
            </p>
          </Card>
        </Link>

        <Link to="/medecin/patients">
          <Card className="p-5 h-full hover:border-(--color-petrol-400) transition-colors">
            <div className="w-9 h-9 rounded-lg bg-(--color-sage-100) flex items-center justify-center mb-3">
              <Users size={18} className="text-(--color-sage-500)" />
            </div>
            <h3 className="font-display font-semibold text-(--color-ink-900)">Mes patients</h3>
            <p className="text-sm text-(--color-ink-600) mt-1">Retrouvez vos patients suivis.</p>
          </Card>
        </Link>

        <Link to="/medecin/consultations">
          <Card className="p-5 h-full hover:border-(--color-petrol-400) transition-colors">
            <div className="w-9 h-9 rounded-lg bg-(--color-amber-400)/20 flex items-center justify-center mb-3">
              <FileText size={18} className="text-(--color-amber-500)" />
            </div>
            <h3 className="font-display font-semibold text-(--color-ink-900)">Consultations</h3>
            <p className="text-sm text-(--color-ink-600) mt-1">Comptes rendus et ordonnances.</p>
            <span className="inline-block mt-2"><Button variant="ghost" className="px-0 py-0 h-auto text-xs">Nouvelle consultation</Button></span>
          </Card>
        </Link>
      </div>
    </div>
  );
}
