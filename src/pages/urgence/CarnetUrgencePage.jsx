import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { Spinner, PageHeader, EmptyState } from '../../components/ui';
import CarnetSections from '../../components/CarnetSections';
import { getCarnetUrgence } from '../../api/reconnaissanceFaciale';

/**
 * Carnet medical complet d'un patient identifie par reconnaissance faciale.
 * Reserve au personnel de sante valide ; strictement en lecture seule (aucune action d'ecriture).
 */
export default function CarnetUrgencePage() {
  const { patientId } = useParams();
  const [carnet, setCarnet] = useState(null);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getCarnetUrgence(patientId)
      .then((data) => !cancelled && setCarnet(data))
      .catch((err) => !cancelled && setErreur(
        err.response?.status === 403
          ? 'Le carnet complet est reserve au personnel de sante valide.'
          : 'Impossible de charger le carnet.',
      ));
    return () => { cancelled = true; };
  }, [patientId]);

  const retour = (
    <Link to="/urgence" className="inline-flex items-center gap-1.5 text-sm font-medium text-(--color-ink-600) hover:text-(--color-petrol-600)">
      <ArrowLeft size={15} /> Retour au scan
    </Link>
  );

  if (erreur) {
    return <div className="space-y-4">{retour}<EmptyState icon={Lock} title="Acces refuse" description={erreur} /></div>;
  }
  if (!carnet) {
    return <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>;
  }

  const p = carnet.patient;
  return (
    <div className="space-y-6 max-w-4xl">
      {retour}
      <PageHeader
        title={`${p.prenom} ${p.nom}`}
        description="Correspondance probable issue de la reconnaissance faciale — verifiez l'identite des que possible."
        action={(
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-(--color-petrol-50) text-(--color-petrol-600)">
            <Lock size={13} /> Lecture seule
          </span>
        )}
      />

      <CarnetSections carnet={carnet} photoReference={carnet.photoReference} />
    </div>
  );
}
