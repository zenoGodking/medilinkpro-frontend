import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { getAllPatients } from '../api/patients';
import { Card, Spinner, EmptyState, PageHeader } from './ui';

/**
 * Vue lecture-seule de la liste des patients, partagee entre les espaces
 * Directeur (memes donnees, memes droits de lecture).
 */
export default function PatientsListView({ description }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAllPatients()
      .then((data) => { if (!cancelled) setPatients(data); })
      .catch(() => { if (!cancelled) setPatients([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="w-7 h-7" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Patients" description={description} />

      {patients.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="Aucun patient" description="Les patients inscrits apparaitront ici." />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {patients.map((p) => (
            <Card key={p.id} className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-(--color-petrol-50) flex items-center justify-center text-(--color-petrol-600) font-display font-semibold shrink-0">
                {p.prenom?.charAt(0)}{p.nom?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-(--color-ink-900) truncate">{p.prenom} {p.nom}</p>
                <p className="text-xs text-(--color-ink-300) truncate">{p.email}</p>
                {p.telephone && <p className="text-xs text-(--color-ink-300)">{p.telephone}</p>}
                {p.contactUrgenceTelephone && (
                  <p className="text-xs text-(--color-clay-500) truncate">
                    Urgence : {p.contactUrgenceNom ? `${p.contactUrgenceNom} - ` : ''}{p.contactUrgenceTelephone}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
