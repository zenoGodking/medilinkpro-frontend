import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { getMesDelivrances } from '../../api/pharmacie';
import { Card, Spinner, PageHeader, EmptyState } from '../../components/ui';

export default function HistoriqueDelivrancesPage() {
  const [liste, setListe] = useState(null);
  useEffect(() => { getMesDelivrances().then(setListe).catch(() => setListe([])); }, []);

  if (!liste) return <div className="flex justify-center py-20"><Spinner className="w-7 h-7" /></div>;
  return (
    <div className="space-y-6">
      <PageHeader title="Historique des delivrances" description="Les ordonnances que vous avez delivrees." />
      {liste.length === 0 ? (
        <Card><EmptyState icon={History} title="Aucune delivrance" description="Les ordonnances delivrees apparaitront ici." /></Card>
      ) : (
        <Card className="p-5">
          <ul className="divide-y divide-(--color-petrol-100)">
            {liste.map((o, i) => (
              <li key={i} className="py-3 text-sm">
                <p className="font-semibold text-(--color-ink-900)">{o.patientPrenom} {o.patientNom} · Dr {o.medecinNomComplet}</p>
                <p className="text-(--color-ink-600) truncate">{o.medicaments}</p>
                <p className="text-xs text-(--color-ink-300)">Delivree le {new Date(o.dateDelivrance).toLocaleString('fr-FR')}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
