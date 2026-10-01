import { LayoutDashboard, CalendarHeart, MapPinned, Hospital, FileHeart, BellRing, QrCode, Activity } from 'lucide-react';
import RoleLayout from '../layouts/RoleLayout';

const NAV_ITEMS = [
  { to: '/patient', label: 'Accueil', icon: LayoutDashboard, end: true },
  { to: '/patient/dossier', label: 'Mon dossier', icon: FileHeart },
  { to: '/patient/suivi', label: 'Mon suivi', icon: Activity },
  { to: '/patient/carte-urgence', label: "Carte d'urgence", icon: QrCode },
  { to: '/patient/recherche', label: 'Trouver un spécialiste', icon: MapPinned },
  { to: '/patient/carte', label: 'Carte des hôpitaux', icon: Hospital },
  { to: '/patient/rendez-vous', label: 'Mes rendez-vous', icon: CalendarHeart },
  { to: '/patient/alertes', label: 'Soins à domicile', icon: BellRing },
];

export default function PatientLayout({ children }) {
  return (
    <RoleLayout navItems={NAV_ITEMS} roleLabel="Espace patient">
      {children}
    </RoleLayout>
  );
}
