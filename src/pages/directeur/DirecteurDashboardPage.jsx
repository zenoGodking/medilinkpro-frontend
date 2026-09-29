import { useEffect, useState } from 'react';
import { Building2, Stethoscope, Users, BadgeCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAllMedecins } from '../../api/medecins';
import { getMesEtablissements, getMesPatientsEtablissement } from '../../api/directeur';
import { Card, Spinner } from '../../components/ui';

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <Card className="p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${accent}`}>
        <Icon size={18} />
      </div>
      <p className="font-display font-bold text-2xl text-(--color-ink-900)">{value}</p>
      <p className="text-sm text-(--color-ink-600) mt-0.5">{label}</p>
    </Card>
  );
}

export default function DirecteurDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Chiffres limites aux etablissements dont le directeur est responsable.
    Promise.all([getMesEtablissements(), getAllMedecins(), getMesPatientsEtablissement()])
      .then(([etablissements, tousMedecins, patients]) => {
        if (cancelled) return;
        const mesIds = new Set(etablissements.map((e) => e.id));
        const medecins = tousMedecins.filter((m) => mesIds.has(m.etablissementId));
        setStats({
          etablissements: etablissements.length,
          medecins: medecins.length,
          medecinsVerifies: medecins.filter((m) => m.verifie).length,
          patients: patients.length,
        });
      })
      .catch(() => { if (!cancelled) setStats({ etablissements: 0, medecins: 0, medecinsVerifies: 0, patients: 0 }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-(--color-petrol-700)">
          Bonjour {user?.prenom} 👋
        </h1>
        <p className="text-(--color-ink-600) mt-1">Vue d'ensemble de votre reseau de sante.</p>
      </div>

      {loading || !stats ? (
        <div className="flex justify-center py-10"><Spinner className="w-6 h-6" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Building2} label="Etablissements" value={stats.etablissements} accent="bg-(--color-petrol-50) text-(--color-petrol-600)" />
          <StatCard icon={Stethoscope} label="Medecins" value={stats.medecins} accent="bg-(--color-sage-100) text-(--color-sage-500)" />
          <StatCard icon={BadgeCheck} label="Medecins verifies" value={stats.medecinsVerifies} accent="bg-(--color-amber-400)/20 text-(--color-amber-500)" />
          <StatCard icon={Users} label="Patients" value={stats.patients} accent="bg-(--color-clay-100) text-(--color-clay-500)" />
        </div>
      )}
    </div>
  );
}
