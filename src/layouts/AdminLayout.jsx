import { UserPlus, LayoutDashboard, UserCheck, Building2, Users } from 'lucide-react';
import RoleLayout from '../layouts/RoleLayout';

const NAV_ITEMS = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/admin/comptes', label: 'Comptes en attente', icon: UserCheck },
  { to: '/admin/utilisateurs', label: 'Tous les utilisateurs', icon: Users },
  { to: '/admin/etablissements', label: 'Établissements', icon: Building2 },
  { to: '/admin/adhesions', label: "Demandes d'adhésion", icon: UserPlus },
];

export default function AdminLayout({ children }) {
  return (
    <RoleLayout navItems={NAV_ITEMS} roleLabel="Administration">
      {children}
    </RoleLayout>
  );
}
