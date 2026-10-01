import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { demanderCodeReinitialisation, reinitialiserMotDePasse } from '../api/auth';
import { Button, TextInput, FieldLabel } from '../components/ui';

/** Mot de passe oublié : envoi d'un code par SMS, puis choix d'un nouveau mot de passe. */
export default function MotDePasseOubliePage() {
  const navigate = useNavigate();
  const [etape, setEtape] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  async function demanderCode(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      const r = await demanderCodeReinitialisation(email);
      setMessage(r.message);
      setEtape('code');
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible d'envoyer le code pour le moment.");
    } finally {
      setEnvoi(false);
    }
  }

  async function valider(e) {
    e.preventDefault();
    if (motDePasse !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setEnvoi(true);
    setErreur(null);
    try {
      await reinitialiserMotDePasse({ email, code, nouveauMotDePasse: motDePasse });
      setEtape('termine');
      setTimeout(() => navigate('/connexion'), 2500);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Code invalide ou expiré.');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="min-h-screen bg-(--color-ivory) flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/connexion" className="inline-flex items-center gap-1.5 text-sm text-(--color-ink-600) font-medium mb-6 hover:text-(--color-petrol-600) transition-colors">
          <ArrowLeft size={15} /> Retour à la connexion
        </Link>

        <div className="bg-white rounded-2xl border border-(--color-petrol-100) shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <KeyRound size={20} className="text-(--color-petrol-600)" />
            <h1 className="font-display font-semibold text-lg text-(--color-ink-900)">Mot de passe oublié</h1>
          </div>

          {erreur && (
            <div className="flex items-start gap-2 bg-(--color-clay-100) text-(--color-clay-500) text-sm rounded-xl px-3.5 py-3 mb-4">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{erreur}</span>
            </div>
          )}

          {etape === 'email' && (
            <form onSubmit={demanderCode} className="space-y-4">
              <p className="text-sm text-(--color-ink-600)">
                Saisissez l'email de votre compte : un code à 6 chiffres sera envoyé par SMS au numéro de téléphone associé.
              </p>
              <div>
                <FieldLabel>Email</FieldLabel>
                <TextInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" />
              </div>
              <Button type="submit" disabled={envoi} className="w-full">{envoi ? 'Envoi...' : 'Recevoir un code'}</Button>
            </form>
          )}

          {etape === 'code' && (
            <form onSubmit={valider} className="space-y-4">
              {message && <p className="text-sm text-(--color-petrol-600) bg-(--color-petrol-50) rounded-xl px-3.5 py-3">{message}</p>}
              <div>
                <FieldLabel>Code reçu par SMS</FieldLabel>
                <TextInput required inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code"
                  value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" />
              </div>
              <div>
                <FieldLabel>Nouveau mot de passe</FieldLabel>
                <TextInput type="password" required minLength={8} autoComplete="new-password"
                  value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder="8 caractères minimum" />
              </div>
              <div>
                <FieldLabel>Confirmer le mot de passe</FieldLabel>
                <TextInput type="password" required minLength={8} autoComplete="new-password"
                  value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
              </div>
              <Button type="submit" disabled={envoi} className="w-full">{envoi ? 'Validation...' : 'Changer mon mot de passe'}</Button>
              <button type="button" onClick={() => { setEtape('email'); setCode(''); }} className="w-full text-sm text-(--color-petrol-600) hover:underline">
                Renvoyer un code
              </button>
              <p className="text-xs text-(--color-ink-600)">
                Pas de numéro de téléphone sur votre compte ? Contactez l'administrateur de la plateforme.
              </p>
            </form>
          )}

          {etape === 'termine' && (
            <div className="flex flex-col items-center text-center py-4">
              <CheckCircle2 size={36} className="text-(--color-sage-500) mb-2" />
              <p className="font-medium text-(--color-ink-900)">Mot de passe modifié.</p>
              <p className="text-sm text-(--color-ink-600)">Redirection vers la connexion...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
