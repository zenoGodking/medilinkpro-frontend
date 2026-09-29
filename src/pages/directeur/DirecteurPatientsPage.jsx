import { useEffect, useMemo, useState } from 'react';
import { Users, Search, Building2, Lock } from 'lucide-react';
import { getMesPatientsEtablissement } from '../../api/directeur';
import { Card, Spinner, EmptyState, PageHeader, TextInput } from '../../components/ui';

/**
 * Patients recus dans les etablissements du directeur : identite et activite seulement.
 * Les donnees medicales restent reservees aux medecins.
 */
export default function DirecteurPatientsPage() {
  const [patients, setPatients] = useState(null);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    getMesPatientsEtablissement().then(setPatients).catch(() => setPatients([]));
  }, []);

  const affiches = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return (patients || []).filter((p) => !q || `${p.prenom} ${p.nom}`.toLowerCase().includes(q));
  }, [patients, recherche]);

  if (!patients) return <div className="flex justify-center py-20"><Spinner className="w-7 h-7" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients de mes etablissements"
        description="Patients ayant eu rendez-vous dans vos etablissements ou avec leurs medecins."
      />
      <p className="flex items-center gap-2 text-sm text-(--color-ink-600) bg-(--color-petrol-50) rounded-xl px-4 py-3 w-fit">
        <Lock size={15} /> Les donnees medicales ne sont visibles que par les medecins.
      </p>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-ink-300)" />
        <TextInput style={{ paddingLeft: '2.25rem' }} placeholder="Rechercher un patient..." value={recherche} onChange={(e) => setRecherche(e.target.value)} />
      </div>

      {affiches.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="Aucun patient" description="Les patients apparaitront apres leur premier rendez-vous dans un de vos etablissements." />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {affiches.map((p) => (
            <Card key={p.id} className="p-4">
              <p className="font-medium text-(--color-ink-900)">{p.prenom} {p.nom}</p>
              {p.telephone && <p className="text-sm text-(--color-ink-600)">{p.telephone}</p>}
              <p className="text-xs text-(--color-ink-300) mt-1">
                {p.nombreRendezVous} rendez-vous · dernier le {new Date(p.dernierRendezVous).toLocaleDateString('fr-FR')}
              </p>
              <p className="flex items-center gap-1 text-xs text-(--color-petrol-600) mt-1">
                <Building2 size={12} /> {p.etablissements.join(', ')}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
