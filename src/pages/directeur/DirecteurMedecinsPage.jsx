import { useEffect, useState } from 'react';
import { Stethoscope, BadgeCheck, MapPin } from 'lucide-react';
import { getAllMedecins } from '../../api/medecins';
import { Card, Spinner, EmptyState, PageHeader } from '../../components/ui';

export default function DirecteurMedecinsPage() {
  const [medecins, setMedecins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAllMedecins()
      .then((data) => { if (!cancelled) setMedecins(data); })
      .catch(() => { if (!cancelled) setMedecins([]); })
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
      <PageHeader title="Médecins" description="Les médecins rattachés à votre réseau." />

      {medecins.length === 0 ? (
        <Card>
          <EmptyState icon={Stethoscope} title="Aucun médecin" description="Les médecins inscrits apparaîtront ici." />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {medecins.map((m) => (
            <Card key={m.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display font-semibold text-(--color-ink-900)">Dr {m.prenom} {m.nom}</p>
                  <p className="text-sm text-(--color-amber-500) font-medium">{m.specialite || 'Généraliste'}</p>
                </div>
                {m.verifie && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-(--color-sage-500) bg-(--color-sage-100) px-2 py-1 rounded-full shrink-0">
                    <BadgeCheck size={13} /> Vérifié
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-1 text-sm text-(--color-ink-600)">
                {m.etablissementNom && <p className="flex items-center gap-1.5"><MapPin size={14} /> {m.etablissementNom}</p>}
                {m.tarif != null && <p>Consultation : <span className="font-medium text-(--color-ink-900)">{m.tarif} FCFA</span></p>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
