import { BellRing, UserCog } from 'lucide-react';
import RoleLayout from './RoleLayout';

const NAV_ITEMS = [
  { to: '/infirmier', label: 'Alertes', icon: BellRing, end: true },
  { to: '/infirmier/profil', label: 'Mon profil', icon: UserCog },
];

export default function InfirmierLayout({ children }) {
  return (
    <RoleLayout navItems={NAV_ITEMS} roleLabel="Espace infirmier(e)">
      {children}
    </RoleLayout>
  );
}
