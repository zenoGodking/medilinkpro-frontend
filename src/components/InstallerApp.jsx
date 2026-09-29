import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

/** Bouton "Installer" : n'apparait que si le navigateur propose l'installation de l'application. */
export default function InstallerApp() {
  const [invite, setInvite] = useState(null);

  useEffect(() => {
    const surInvite = (e) => { e.preventDefault(); setInvite(e); };
    const installe = () => setInvite(null);
    window.addEventListener('beforeinstallprompt', surInvite);
    window.addEventListener('appinstalled', installe);
    return () => {
      window.removeEventListener('beforeinstallprompt', surInvite);
      window.removeEventListener('appinstalled', installe);
    };
  }, []);

  if (!invite) return null;
  return (
    <button
      type="button"
      onClick={async () => { invite.prompt(); await invite.userChoice; setInvite(null); }}
      className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold bg-(--color-petrol-50) text-(--color-petrol-600) hover:bg-(--color-petrol-100)"
    >
      <Download size={16} /> <span className="hidden sm:inline">Installer l'app</span>
    </button>
  );
}
