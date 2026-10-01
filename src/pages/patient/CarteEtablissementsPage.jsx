import { useEffect, useState } from 'react';
import { getPublicEtablissements } from '../../api/etablissements';
import { PageHeader, Spinner } from '../../components/ui';
import CarteEtablissements from '../../components/CarteEtablissements';

/** Carte des hopitaux et cliniques, avec "pres de moi" et itineraire guide dans l'application. */
export default function CarteEtablissementsPage() {
  const [etablissements, setEtablissements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let annule = false;
    getPublicEtablissements()
      .then((data) => { if (!annule) setEtablissements(data); })
      .catch(() => { if (!annule) setEtablissements([]); })
      .finally(() => { if (!annule) setLoading(false); });
    return () => { annule = true; };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Hôpitaux et cliniques" description="Trouvez l'établissement le plus proche et laissez-vous guider jusqu'à lui." />
      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="w-7 h-7" /></div>
      ) : (
        <CarteEtablissements etablissements={etablissements} lienDetail={(e) => `/etablissements/${e.id}`} />
      )}
    </div>
  );
}
