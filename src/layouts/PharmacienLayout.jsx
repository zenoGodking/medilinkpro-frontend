import { ScanLine, History } from 'lucide-react';
import RoleLayout from './RoleLayout';

const NAV_ITEMS = [
  { to: '/pharmacien', label: 'Scanner une ordonnance', icon: ScanLine, end: true },
  { to: '/pharmacien/historique', label: 'Historique', icon: History },
];

export default function PharmacienLayout({ children }) {
  return (
    <RoleLayout navItems={NAV_ITEMS} roleLabel="Espace pharmacie">
      {children}
    </RoleLayout>
  );
}
