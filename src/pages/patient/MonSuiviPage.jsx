import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/ui';
import SuiviSante from '../../components/suivi/SuiviSante';

export default function MonSuiviPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon suivi"
        description="Vos mesures (tension, glycémie...), vos traitements, vos vaccins et votre suivi de grossesse. Vos médecins peuvent les consulter."
      />
      <SuiviSante patientId={user.userId} estPatient />
    </div>
  );
}
