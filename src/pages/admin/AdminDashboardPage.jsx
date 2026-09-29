import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, Building2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getComptesEnAttente } from '../../api/admin';
import { Card, Spinner } from '../../components/ui';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [enAttente, setEnAttente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getComptesEnAttente()
      .then((data) => { if (!cancelled) setEnAttente(data); })
      .catch(() => { if (!cancelled) setEnAttente([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-(--color-petrol-700)">
          Bonjour {user?.prenom} 👋
        </h1>
        <p className="text-(--color-ink-600) mt-1">Validez les inscriptions et gardez la plateforme fiable.</p>
      </div>

      {loading || !enAttente ? (
        <div className="flex justify-center py-10"><Spinner className="w-6 h-6" /></div>
      ) : enAttente.length > 0 ? (
        <div className="relative overflow-hidden rounded-2xl bg-(--color-petrol-600) text-white p-6 sm:p-8">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-(--color-amber-400)/15" aria-hidden="true" />
          <p className="relative text-xs uppercase tracking-wider font-semibold text-(--color-amber-400) mb-2">
            Action requise
          </p>
          <h2 className="relative font-display font-bold text-xl sm:text-2xl mb-1">
            {enAttente.length} compte{enAttente.length > 1 ? 's' : ''} en attente de validation
          </h2>
          <p className="relative text-white/80 text-sm max-w-md">
            Des medecins, infirmiers ou directeurs attendent votre validation pour pouvoir se connecter.
          </p>
          <Link
            to="/admin/comptes"
            className="relative inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-(--color-petrol-900) bg-(--color-amber-400) hover:bg-(--color-amber-500) px-4 py-2 rounded-xl transition-colors"
          >
            Examiner les comptes <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <Card className="p-6">
          <p className="text-(--color-ink-600)">Aucun compte en attente de validation pour le moment.</p>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Link to="/admin/comptes">
          <Card className="p-5 h-full hover:border-(--color-petrol-400) transition-colors">
            <div className="w-9 h-9 rounded-lg bg-(--color-amber-400)/20 flex items-center justify-center mb-3">
              <UserCheck size={18} className="text-(--color-amber-500)" />
            </div>
            <h3 className="font-display font-semibold text-(--color-ink-900)">Comptes en attente</h3>
            <p className="text-sm text-(--color-ink-600) mt-1">Approuvez ou refusez les inscriptions.</p>
          </Card>
        </Link>

        <Link to="/admin/etablissements">
          <Card className="p-5 h-full hover:border-(--color-petrol-400) transition-colors">
            <div className="w-9 h-9 rounded-lg bg-(--color-petrol-50) flex items-center justify-center mb-3">
              <Building2 size={18} className="text-(--color-petrol-600)" />
            </div>
            <h3 className="font-display font-semibold text-(--color-ink-900)">Etablissements</h3>
            <p className="text-sm text-(--color-ink-600) mt-1">Gerez les etablissements de sante.</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
