import { LayoutDashboard, CalendarHeart, MapPinned, FileHeart, BellRing, QrCode } from 'lucide-react';
import RoleLayout from '../layouts/RoleLayout';

const NAV_ITEMS = [
  { to: '/patient', label: 'Accueil', icon: LayoutDashboard, end: true },
  { to: '/patient/dossier', label: 'Mon dossier', icon: FileHeart },
  { to: '/patient/carte-urgence', label: "Carte d'urgence", icon: QrCode },
  { to: '/patient/recherche', label: 'Trouver un specialiste', icon: MapPinned },
  { to: '/patient/rendez-vous', label: 'Mes rendez-vous', icon: CalendarHeart },
  { to: '/patient/alertes', label: 'Soins a domicile', icon: BellRing },
];

export default function PatientLayout({ children }) {
  return (
    <RoleLayout navItems={NAV_ITEMS} roleLabel="Espace patient">
      {children}
    </RoleLayout>
  );
}
