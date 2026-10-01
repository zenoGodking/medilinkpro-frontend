import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/marketing/LandingPage';
import LoginPage from './pages/LoginPage';
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const MotDePasseOubliePage = lazy(() => import('./pages/MotDePasseOubliePage'));
const EtablissementsPubliquesPage = lazy(() => import('./pages/public/EtablissementsPubliquesPage'));
const EtablissementDetailPage = lazy(() => import('./pages/public/EtablissementDetailPage'));

// Espace Patient
import PatientLayout from './layouts/PatientLayout';
const DashboardPage = lazy(() => import('./pages/patient/DashboardPage'));
const DossierMedicalPage = lazy(() => import('./pages/patient/DossierMedicalPage'));
const RechercheMedecinsPage = lazy(() => import('./pages/patient/RechercheMedecinsPage'));
const NouveauRendezVousPage = lazy(() => import('./pages/patient/NouveauRendezVousPage'));
const CarteEtablissementsPage = lazy(() => import('./pages/patient/CarteEtablissementsPage'));
const RendezVousListPage = lazy(() => import('./pages/patient/RendezVousListPage'));
const PatientAlertesPage = lazy(() => import('./pages/patient/PatientAlertesPage'));

// Espace Infirmier
import InfirmierLayout from './layouts/InfirmierLayout';
const InfirmierAlertesPage = lazy(() => import('./pages/infirmier/InfirmierAlertesPage'));
const InfirmierProfilPage = lazy(() => import('./pages/infirmier/InfirmierProfilPage'));

// Espace Medecin
import MedecinLayout from './layouts/MedecinLayout';
const MedecinDashboardPage = lazy(() => import('./pages/medecin/MedecinDashboardPage'));
const MedecinAgendaPage = lazy(() => import('./pages/medecin/MedecinAgendaPage'));
const MedecinPatientsPage = lazy(() => import('./pages/medecin/MedecinPatientsPage'));
const MedecinCarnetPage = lazy(() => import('./pages/medecin/MedecinCarnetPage'));
const MedecinConsultationsPage = lazy(() => import('./pages/medecin/MedecinConsultationsPage'));
const MedecinProfilPage = lazy(() => import('./pages/medecin/MedecinProfilPage'));
const MedecinEtablissementPage = lazy(() => import('./pages/medecin/MedecinEtablissementPage'));

// Espace Directeur
import DirecteurLayout from './layouts/DirecteurLayout';
const DirecteurDashboardPage = lazy(() => import('./pages/directeur/DirecteurDashboardPage'));
const DirecteurEtablissementsPage = lazy(() => import('./pages/directeur/DirecteurEtablissementsPage'));
const DirecteurMedecinsPage = lazy(() => import('./pages/directeur/DirecteurMedecinsPage'));
const DirecteurPatientsPage = lazy(() => import('./pages/directeur/DirecteurPatientsPage'));

// Identification d'urgence par reconnaissance faciale (tous les utilisateurs connectes)
import LayoutUtilisateur from './layouts/LayoutUtilisateur';
const ScanUrgencePage = lazy(() => import('./pages/urgence/ScanUrgencePage'));
const CarnetUrgencePage = lazy(() => import('./pages/urgence/CarnetUrgencePage'));
const CarteScanneePage = lazy(() => import('./pages/urgence/CarteScanneePage'));
const MaCarteUrgencePage = lazy(() => import('./pages/patient/MaCarteUrgencePage'));
const MonSuiviPage = lazy(() => import('./pages/patient/MonSuiviPage'));

// Espace Pharmacie
import PharmacienLayout from './layouts/PharmacienLayout';
const PharmacienScanPage = lazy(() => import('./pages/pharmacien/PharmacienScanPage'));
const OrdonnanceVerifieePage = lazy(() => import('./pages/pharmacien/OrdonnanceVerifieePage'));
const HistoriqueDelivrancesPage = lazy(() => import('./pages/pharmacien/HistoriqueDelivrancesPage'));

// Espace Admin
import AdminLayout from './layouts/AdminLayout';
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminComptesPage = lazy(() => import('./pages/admin/AdminComptesPage'));
const AdminUtilisateursPage = lazy(() => import('./pages/admin/AdminUtilisateursPage'));
const AdminEtablissementsPage = lazy(() => import('./pages/admin/AdminEtablissementsPage'));

// Nouvelles fonctionnalites : adhesions, disponibilites, teleconsultation
const DemandesAdhesionPage = lazy(() => import('./pages/commun/DemandesAdhesionPage'));
const MedecinDisponibilitesPage = lazy(() => import('./pages/medecin/MedecinDisponibilitesPage'));
const TeleconsultationPage = lazy(() => import('./pages/commun/TeleconsultationPage'));

// Chaque page est chargee a la demande (code splitting) : le premier affichage ne telecharge
// que l'accueil et la connexion, ce qui compte sur un reseau mobile lent.
function ChargementPage() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="animate-spin rounded-full w-7 h-7 border-2 border-(--color-petrol-100) border-t-(--color-petrol-600)" />
    </div>
  );
}

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
        <Suspense fallback={<ChargementPage />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/inscription" element={<RegisterPage />} />
          <Route path="/mot-de-passe-oublie" element={<MotDePasseOubliePage />} />
          <Route path="/etablissements" element={<EtablissementsPubliquesPage />} />
          <Route path="/etablissements/:id" element={<EtablissementDetailPage />} />

          {/* Urgence : scan ouvert a tout utilisateur connecte, carnet complet reserve au personnel de sante */}
          <Route path="/urgence" element={<ProtectedRoute><LayoutUtilisateur><ScanUrgencePage /></LayoutUtilisateur></ProtectedRoute>} />
          <Route path="/urgence/carte/:jeton" element={<ProtectedRoute><LayoutUtilisateur><CarteScanneePage /></LayoutUtilisateur></ProtectedRoute>} />
          <Route path="/urgence/carnet/:patientId" element={<ProtectedRoute allowedRoles={['MEDECIN', 'INFIRMIER']}><LayoutUtilisateur><CarnetUrgencePage /></LayoutUtilisateur></ProtectedRoute>} />

          {/* Teleconsultation video : le medecin et le patient du rendez-vous */}
          <Route path="/teleconsultation/:rendezVousId" element={<ProtectedRoute allowedRoles={['PATIENT', 'MEDECIN']}><LayoutUtilisateur><TeleconsultationPage /></LayoutUtilisateur></ProtectedRoute>} />

          {/* Espace Patient */}
          <Route path="/patient" element={<Espace role="PATIENT" Layout={PatientLayout}><DashboardPage /></Espace>} />
          <Route path="/patient/dossier" element={<Espace role="PATIENT" Layout={PatientLayout}><DossierMedicalPage /></Espace>} />
          <Route path="/patient/suivi" element={<Espace role="PATIENT" Layout={PatientLayout}><MonSuiviPage /></Espace>} />
          <Route path="/patient/carte-urgence" element={<Espace role="PATIENT" Layout={PatientLayout}><MaCarteUrgencePage /></Espace>} />
          <Route path="/patient/recherche" element={<Espace role="PATIENT" Layout={PatientLayout}><RechercheMedecinsPage /></Espace>} />
          <Route path="/patient/carte" element={<Espace role="PATIENT" Layout={PatientLayout}><CarteEtablissementsPage /></Espace>} />
          <Route path="/patient/rendez-vous" element={<Espace role="PATIENT" Layout={PatientLayout}><RendezVousListPage /></Espace>} />
          <Route path="/patient/rendez-vous/nouveau/:medecinId" element={<Espace role="PATIENT" Layout={PatientLayout}><NouveauRendezVousPage /></Espace>} />
          <Route path="/patient/alertes" element={<Espace role="PATIENT" Layout={PatientLayout}><PatientAlertesPage /></Espace>} />

          {/* Espace Infirmier */}
          <Route path="/infirmier" element={<Espace role="INFIRMIER" Layout={InfirmierLayout}><InfirmierAlertesPage /></Espace>} />
          <Route path="/infirmier/profil" element={<Espace role="INFIRMIER" Layout={InfirmierLayout}><InfirmierProfilPage /></Espace>} />

          {/* Espace Pharmacie */}
          <Route path="/pharmacien" element={<Espace role="PHARMACIEN" Layout={PharmacienLayout}><PharmacienScanPage /></Espace>} />
          <Route path="/pharmacien/historique" element={<Espace role="PHARMACIEN" Layout={PharmacienLayout}><HistoriqueDelivrancesPage /></Espace>} />
          <Route path="/pharmacie/ordonnance/:jeton" element={<Espace role="PHARMACIEN" Layout={PharmacienLayout}><OrdonnanceVerifieePage /></Espace>} />

          {/* Espace Medecin */}
          <Route path="/medecin" element={<Espace role="MEDECIN" Layout={MedecinLayout}><MedecinDashboardPage /></Espace>} />
          <Route path="/medecin/agenda" element={<Espace role="MEDECIN" Layout={MedecinLayout}><MedecinAgendaPage /></Espace>} />
          <Route path="/medecin/patients" element={<Espace role="MEDECIN" Layout={MedecinLayout}><MedecinPatientsPage /></Espace>} />
          <Route path="/medecin/patients/:patientId" element={<Espace role="MEDECIN" Layout={MedecinLayout}><MedecinCarnetPage /></Espace>} />
          <Route path="/medecin/consultations" element={<Espace role="MEDECIN" Layout={MedecinLayout}><MedecinConsultationsPage /></Espace>} />
          <Route path="/medecin/disponibilites" element={<Espace role="MEDECIN" Layout={MedecinLayout}><MedecinDisponibilitesPage /></Espace>} />
          <Route path="/medecin/etablissement" element={<Espace role="MEDECIN" Layout={MedecinLayout}><MedecinEtablissementPage /></Espace>} />
          <Route path="/medecin/profil" element={<Espace role="MEDECIN" Layout={MedecinLayout}><MedecinProfilPage /></Espace>} />

          {/* Espace Directeur */}
          <Route path="/directeur" element={<Espace role="DIRECTEUR" Layout={DirecteurLayout}><DirecteurDashboardPage /></Espace>} />
          <Route path="/directeur/etablissements" element={<Espace role="DIRECTEUR" Layout={DirecteurLayout}><DirecteurEtablissementsPage /></Espace>} />
          <Route path="/directeur/medecins" element={<Espace role="DIRECTEUR" Layout={DirecteurLayout}><DirecteurMedecinsPage /></Espace>} />
          <Route path="/directeur/adhesions" element={<Espace role="DIRECTEUR" Layout={DirecteurLayout}><DemandesAdhesionPage /></Espace>} />
          <Route path="/directeur/patients" element={<Espace role="DIRECTEUR" Layout={DirecteurLayout}><DirecteurPatientsPage /></Espace>} />

          {/* Espace Admin */}
          <Route path="/admin" element={<Espace role="ADMIN" Layout={AdminLayout}><AdminDashboardPage /></Espace>} />
          <Route path="/admin/comptes" element={<Espace role="ADMIN" Layout={AdminLayout}><AdminComptesPage /></Espace>} />
          <Route path="/admin/utilisateurs" element={<Espace role="ADMIN" Layout={AdminLayout}><AdminUtilisateursPage /></Espace>} />
          <Route path="/admin/etablissements" element={<Espace role="ADMIN" Layout={AdminLayout}><AdminEtablissementsPage /></Espace>} />
          <Route path="/admin/adhesions" element={<Espace role="ADMIN" Layout={AdminLayout}><DemandesAdhesionPage /></Espace>} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
