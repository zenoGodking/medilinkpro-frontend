import { LayoutDashboard, CalendarHeart, CalendarClock, Users, FileText, UserCog, Building2 } from 'lucide-react';
import RoleLayout from '../layouts/RoleLayout';

const NAV_ITEMS = [
  { to: '/medecin', label: 'Accueil', icon: LayoutDashboard, end: true },
  { to: '/medecin/agenda', label: 'Mon agenda', icon: CalendarHeart },
  { to: '/medecin/disponibilites', label: 'Mes disponibilités', icon: CalendarClock },
  { to: '/medecin/patients', label: 'Carnets patients', icon: Users },
  { to: '/medecin/consultations', label: 'Consultations', icon: FileText },
  { to: '/medecin/etablissement', label: 'Mon établissement', icon: Building2 },
  { to: '/medecin/profil', label: 'Mon profil', icon: UserCog },
];

export default function MedecinLayout({ children }) {
  return (
    <RoleLayout navItems={NAV_ITEMS} roleLabel="Espace médecin">
      {children}
    </RoleLayout>
  );
}
