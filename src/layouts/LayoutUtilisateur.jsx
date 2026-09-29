import { useAuth } from '../context/AuthContext';
import PatientLayout from './PatientLayout';
import MedecinLayout from './MedecinLayout';
import InfirmierLayout from './InfirmierLayout';
import DirecteurLayout from './DirecteurLayout';
import AdminLayout from './AdminLayout';

const LAYOUT_BY_ROLE = {
  PATIENT: PatientLayout,
  MEDECIN: MedecinLayout,
  INFIRMIER: InfirmierLayout,
  DIRECTEUR: DirecteurLayout,
  ADMIN: AdminLayout,
};

/** Layout de l'espace de l'utilisateur connecte, pour les pages communes a tous les roles (ex: urgence). */
export default function LayoutUtilisateur({ children }) {
  const { user } = useAuth();
  const Layout = LAYOUT_BY_ROLE[user?.role] || PatientLayout;
  return <Layout>{children}</Layout>;
}
