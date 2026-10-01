import EtablissementsManager from '../../components/EtablissementsManager';
import { getMesEtablissements } from '../../api/directeur';

export default function DirecteurEtablissementsPage() {
  return (
    <EtablissementsManager
      description="Les hôpitaux et cliniques dont vous êtes responsable. Un établissement que vous créez vous est automatiquement attribué."
      chargerEtablissements={getMesEtablissements}
    />
  );
}
