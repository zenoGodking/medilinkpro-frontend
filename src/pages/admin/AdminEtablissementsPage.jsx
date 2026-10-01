import EtablissementsManager from '../../components/EtablissementsManager';

export default function AdminEtablissementsPage() {
  return (
    <EtablissementsManager
      description="Supervisez l'ensemble des établissements de la plateforme et attribuez leur directeur responsable."
      modeAdmin
    />
  );
}
