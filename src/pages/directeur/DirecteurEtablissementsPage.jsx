import EtablissementsManager from '../../components/EtablissementsManager';
import { getMesEtablissements } from '../../api/directeur';

export default function DirecteurEtablissementsPage() {
  return (
    <EtablissementsManager
      description="Les hopitaux et cliniques dont vous etes responsable. Un etablissement que vous creez vous est automatiquement attribue."
      chargerEtablissements={getMesEtablissements}
    />
  );
}
