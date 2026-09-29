import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Stethoscope, ScanFace } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import InstallerApp from '../components/InstallerApp';

/**
 * Layout partage par tous les espaces authentifies (Patient, Medecin, Infirmier,
 * Directeur, Admin). Les items de navigation sont fournis par chaque espace via
 * navItems, ce qui permet a chaque role d'avoir son propre menu tout en gardant
 * une identite visuelle et une structure communes.
 */
export default function RoleLayout({ navItems, roleLabel, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/connexion');
  }

  return (
    <div className="min-h-screen bg-(--color-ivory)">
      <header className="border-b border-(--color-petrol-100) bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-(--color-petrol-600) flex items-center justify-center text-(--color-ivory)">
              <Stethoscope size={18} strokeWidth={2.25} />
            </div>
            <span className="font-display font-semibold text-lg text-(--color-petrol-700) tracking-tight">
              MediLinkPro
            </span>
            {roleLabel && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-(--color-petrol-50) text-(--color-petrol-600) ml-1">
                {roleLabel}
              </span>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-(--color-petrol-600) text-white'
                      : 'text-(--color-ink-600) hover:bg-(--color-petrol-50) hover:text-(--color-petrol-700)'
                  }`
                }
              >
                <Icon size={16} strokeWidth={2} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <InstallerApp />
            {/* Identification d'urgence : accessible depuis tous les espaces */}
            <NavLink
              to="/urgence"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
                  isActive ? 'bg-(--color-clay-500) text-white' : 'bg-(--color-clay-100) text-(--color-clay-500) hover:bg-(--color-clay-100)/70'
                }`
              }
            >
              <ScanFace size={16} strokeWidth={2} />
              <span className="hidden sm:inline">Urgence</span>
            </NavLink>
            <span className="hidden sm:block text-sm text-(--color-ink-600)">
              {user?.prenom} {user?.nom}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-medium text-(--color-clay-500) hover:text-(--color-clay-500)/80 transition-colors px-3 py-2 rounded-full hover:bg-(--color-clay-100)"
            >
              <LogOut size={16} strokeWidth={2} />
              <span className="hidden sm:inline">Deconnexion</span>
            </button>
          </div>
        </div>

        <nav className="md:hidden flex items-center gap-1 px-4 pb-3 overflow-x-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-(--color-petrol-600) text-white'
                    : 'bg-(--color-petrol-50) text-(--color-ink-600)'
                }`
              }
            >
              <Icon size={14} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
