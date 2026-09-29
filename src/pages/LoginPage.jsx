import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Stethoscope, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, TextInput, FieldLabel } from '../components/ui';
import { homeForRole } from '../utils/roles';

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Page a retrouver apres connexion ; uniquement un chemin interne (pas de redirection vers un autre site).
  const from = location.state?.from;
  const retour = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : null;
  const [form, setForm] = useState({ email: '', motDePasse: '' });

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const response = await login(form);
      navigate(retour || homeForRole(response.role), { replace: true });
    } catch {
      // l'erreur est deja geree et affichee via le contexte
    }
  }

  return (
    <div className="min-h-screen bg-(--color-ivory) flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-(--color-ink-600) font-medium mb-6 hover:text-(--color-petrol-600) transition-colors">
          <ArrowLeft size={15} /> Retour a l'accueil
        </Link>

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-(--color-petrol-600) flex items-center justify-center text-white mb-3">
            <Stethoscope size={24} strokeWidth={2} />
          </div>
          <h1 className="font-display font-bold text-2xl text-(--color-petrol-700)">MediLinkPro</h1>
          <p className="text-sm text-(--color-ink-600) mt-1">Votre suivi medical, simplifie.</p>
        </div>

        <div className="bg-white rounded-2xl border border-(--color-petrol-100) shadow-sm p-6">
          <h2 className="font-display font-semibold text-lg text-(--color-ink-900) mb-5">Se connecter</h2>

          {error && (
            <div className="flex items-start gap-2 bg-(--color-clay-100) text-(--color-clay-500) text-sm rounded-xl px-3.5 py-3 mb-4">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <FieldLabel>Email</FieldLabel>
              <TextInput
                type="email"
                required
                placeholder="vous@exemple.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Mot de passe</FieldLabel>
              <TextInput
                type="password"
                required
                placeholder="••••••••"
                value={form.motDePasse}
                onChange={(e) => setForm({ ...form, motDePasse: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-(--color-ink-600) mt-5">
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="font-semibold text-(--color-petrol-600) hover:underline">
            Creer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
