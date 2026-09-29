import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/marketing/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EtablissementsPubliquesPage from './pages/public/EtablissementsPubliquesPage';
import EtablissementDetailPage from './pages/public/EtablissementDetailPage';

// Espace Patient
import PatientLayout from './layouts/PatientLayout';
import DashboardPage from './pages/patient/DashboardPage';
import DossierMedicalPage from './pages/patient/DossierMedicalPage';
import RechercheMedecinsPage from './pages/patient/RechercheMedecinsPage';
import NouveauRendezVousPage from './pages/patient/NouveauRendezVousPage';
import RendezVousListPage from './pages/patient/RendezVousListPage';
import PatientAlertesPage from './pages/patient/PatientAlertesPage';

// Espace Infirmier
import InfirmierLayout from './layouts/InfirmierLayout';
import InfirmierAlertesPage from './pages/infirmier/InfirmierAlertesPage';

// Espace Medecin
import MedecinLayout from './layouts/MedecinLayout';
import MedecinDashboardPage from './pages/medecin/MedecinDashboardPage';
import MedecinAgendaPage from './pages/medecin/MedecinAgendaPage';
import MedecinPatientsPage from './pages/medecin/MedecinPatientsPage';
import MedecinCarnetPage from './pages/medecin/MedecinCarnetPage';
import MedecinConsultationsPage from './pages/medecin/MedecinConsultationsPage';
import MedecinProfilPage from './pages/medecin/MedecinProfilPage';
import MedecinEtablissementPage from './pages/medecin/MedecinEtablissementPage';

// Espace Directeur
import DirecteurLayout from './layouts/DirecteurLayout';
import DirecteurDashboardPage from './pages/directeur/DirecteurDashboardPage';
import DirecteurEtablissementsPage from './pages/directeur/DirecteurEtablissementsPage';
import DirecteurMedecinsPage from './pages/directeur/DirecteurMedecinsPage';
import DirecteurPatientsPage from './pages/directeur/DirecteurPatientsPage';

// Identification d'urgence par reconnaissance faciale (tous les utilisateurs connectes)
import LayoutUtilisateur from './layouts/LayoutUtilisateur';
import ScanUrgencePage from './pages/urgence/ScanUrgencePage';
import CarnetUrgencePage from './pages/urgence/CarnetUrgencePage';

// Espace Admin
import AdminLayout from './layouts/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminComptesPage from './pages/admin/AdminComptesPage';
import AdminUtilisateursPage from './pages/admin/AdminUtilisateursPage';
import AdminEtablissementsPage from './pages/admin/AdminEtablissementsPage';

function Espace({ role, Layout, children }) {
  return (
    <ProtectedRoute allowedRoles={[role]}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/inscription" element={<RegisterPage />} />
          <Route path="/etablissements" element={<EtablissementsPubliquesPage />} />
          <Route path="/etablissements/:id" element={<EtablissementDetailPage />} />

          {/* Urgence : scan ouvert a tout utilisateur connecte, carnet complet reserve au personnel de sante */}
          <Route path="/urgence" element={<ProtectedRoute><LayoutUtilisateur><ScanUrgencePage /></LayoutUtilisateur></ProtectedRoute>} />
          <Route path="/urgence/carnet/:patientId" element={<ProtectedRoute allowedRoles={['MEDECIN', 'INFIRMIER']}><LayoutUtilisateur><CarnetUrgencePage /></LayoutUtilisateur></ProtectedRoute>} />

          {/* Espace Patient */}
          <Route path="/patient" element={<Espace role="PATIENT" Layout={PatientLayout}><DashboardPage /></Espace>} />
          <Route path="/patient/dossier" element={<Espace role="PATIENT" Layout={PatientLayout}><DossierMedicalPage /></Espace>} />
          <Route path="/patient/recherche" element={<Espace role="PATIENT" Layout={PatientLayout}><RechercheMedecinsPage /></Espace>} />
          <Route path="/patient/rendez-vous" element={<Espace role="PATIENT" Layout={PatientLayout}><RendezVousListPage /></Espace>} />
          <Route path="/patient/rendez-vous/nouveau/:medecinId" element={<Espace role="PATIENT" Layout={PatientLayout}><NouveauRendezVousPage /></Espace>} />
          <Route path="/patient/alertes" element={<Espace role="PATIENT" Layout={PatientLayout}><PatientAlertesPage /></Espace>} />

          {/* Espace Infirmier */}
          <Route path="/infirmier" element={<Espace role="INFIRMIER" Layout={InfirmierLayout}><InfirmierAlertesPage /></Espace>} />

          {/* Espace Medecin */}
          <Route path="/medecin" element={<Espace role="MEDECIN" Layout={MedecinLayout}><MedecinDashboardPage /></Espace>} />
          <Route path="/medecin/agenda" element={<Espace role="MEDECIN" Layout={MedecinLayout}><MedecinAgendaPage /></Espace>} />
          <Route path="/medecin/patients" element={<Espace role="MEDECIN" Layout={MedecinLayout}><MedecinPatientsPage /></Espace>} />
          <Route path="/medecin/patients/:patientId" element={<Espace role="MEDECIN" Layout={MedecinLayout}><MedecinCarnetPage /></Espace>} />
          <Route path="/medecin/consultations" element={<Espace role="MEDECIN" Layout={MedecinLayout}><MedecinConsultationsPage /></Espace>} />
          <Route path="/medecin/etablissement" element={<Espace role="MEDECIN" Layout={MedecinLayout}><MedecinEtablissementPage /></Espace>} />
          <Route path="/medecin/profil" element={<Espace role="MEDECIN" Layout={MedecinLayout}><MedecinProfilPage /></Espace>} />

          {/* Espace Directeur */}
          <Route path="/directeur" element={<Espace role="DIRECTEUR" Layout={DirecteurLayout}><DirecteurDashboardPage /></Espace>} />
          <Route path="/directeur/etablissements" element={<Espace role="DIRECTEUR" Layout={DirecteurLayout}><DirecteurEtablissementsPage /></Espace>} />
          <Route path="/directeur/medecins" element={<Espace role="DIRECTEUR" Layout={DirecteurLayout}><DirecteurMedecinsPage /></Espace>} />
          <Route path="/directeur/patients" element={<Espace role="DIRECTEUR" Layout={DirecteurLayout}><DirecteurPatientsPage /></Espace>} />

          {/* Espace Admin */}
          <Route path="/admin" element={<Espace role="ADMIN" Layout={AdminLayout}><AdminDashboardPage /></Espace>} />
          <Route path="/admin/comptes" element={<Espace role="ADMIN" Layout={AdminLayout}><AdminComptesPage /></Espace>} />
          <Route path="/admin/utilisateurs" element={<Espace role="ADMIN" Layout={AdminLayout}><AdminUtilisateursPage /></Espace>} />
          <Route path="/admin/etablissements" element={<Espace role="ADMIN" Layout={AdminLayout}><AdminEtablissementsPage /></Espace>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
