import { useEffect, useState } from 'react';
import { getStatistiques } from '../../api/dashboard';
import { PageHeader, Spinner, Card } from '../../components/ui';
import TableauStatistiques from '../../components/TableauStatistiques';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    let annule = false;
    getStatistiques()
      .then((s) => { if (!annule) setStats(s); })
      .catch(() => { if (!annule) setErreur('Statistiques indisponibles pour le moment.'); });
    return () => { annule = true; };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Tableau de bord" description="Activité de toute la plateforme sur les 30 derniers jours." />
      {erreur ? <Card className="p-6 text-sm text-(--color-ink-600)">{erreur}</Card>
        : !stats ? <div className="flex justify-center py-20"><Spinner className="w-7 h-7" /></div>
          : <TableauStatistiques stats={stats} admin liens={{ etablissements: '/admin/etablissements', patients: '/admin/utilisateurs', adhesions: '/admin/adhesions', comptes: '/admin/comptes' }} />}
    </div>
  );
}
