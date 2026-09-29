import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Stethoscope, AlertCircle, ArrowLeft, CheckCircle2, User, Building2, HeartPulse, Pill,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, TextInput, FieldLabel, Select } from '../components/ui';
import CapturePhotoVisage from '../components/CapturePhotoVisage';
import { homeForRole } from '../utils/roles';

const GROUPES_SANGUINS = [
  '', 'A_POSITIF', 'A_NEGATIF', 'B_POSITIF', 'B_NEGATIF',
  'AB_POSITIF', 'AB_NEGATIF', 'O_POSITIF', 'O_NEGATIF', 'INCONNU',
];

const GROUPE_LABELS = {
  '': 'Je ne sais pas',
  A_POSITIF: 'A+', A_NEGATIF: 'A-',
  B_POSITIF: 'B+', B_NEGATIF: 'B-',
  AB_POSITIF: 'AB+', AB_NEGATIF: 'AB-',
  O_POSITIF: 'O+', O_NEGATIF: 'O-',
  INCONNU: 'Inconnu',
};

// L'inscription ADMIN n'est volontairement pas proposee ici : un administrateur
// est cree par un administrateur existant, pas via l'inscription publique.
const ROLES = [
  { value: 'PATIENT', label: 'Patient', description: 'Suivre mon dossier medical et prendre rendez-vous', icon: User },
  { value: 'MEDECIN', label: 'Medecin', description: 'Proposer des consultations et gerer mon agenda', icon: Stethoscope },
  { value: 'INFIRMIER', label: 'Infirmier(e)', description: 'Repondre aux alertes de soins a domicile', icon: HeartPulse },
  { value: 'PHARMACIEN', label: 'Pharmacien(ne)', description: 'Verifier et delivrer les ordonnances', icon: Pill },
  { value: 'DIRECTEUR', label: 'Directeur', description: "Superviser un etablissement de sante", icon: Building2 },
];

const INITIAL_FORM = {
  nom: '', prenom: '', email: '', motDePasse: '', telephone: '',
  dateNaissance: '', groupeSanguin: '', allergies: '', conditionsUrgence: '', contactUrgenceNom: '', contactUrgenceTelephone: '',
  specialite: '', numeroOrdre: '', tarif: '', ville: '', quartier: '', nomPharmacie: '', numeroAgrement: '',
};

export default function RegisterPage() {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('PATIENT');
  const [form, setForm] = useState(INITIAL_FORM);
  const [pendingMessage, setPendingMessage] = useState(null);
  // Photo du visage + empreinte faciale, obligatoires pour un patient (reconnaissance en urgence).
  const [visage, setVisage] = useState(null);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleRoleChange(value) {
    setRole(value);
    setForm(INITIAL_FORM);
    setVisage(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        motDePasse: form.motDePasse,
        telephone: form.telephone || null,
        role,
        ...(role === 'PATIENT' && {
          dateNaissance: form.dateNaissance || null,
          groupeSanguin: form.groupeSanguin || null,
          allergies: form.allergies || null,
          conditionsUrgence: form.conditionsUrgence || null,
          contactUrgenceNom: form.contactUrgenceNom || null,
          contactUrgenceTelephone: form.contactUrgenceTelephone || null,
        }),
        ...(role === 'PHARMACIEN' && {
          nomPharmacie: form.nomPharmacie || null,
          numeroAgrement: form.numeroAgrement || null,
          ville: form.ville || null,
        }),
        ...(role === 'MEDECIN' && {
          specialite: form.specialite || null,
          numeroOrdre: form.numeroOrdre || null,
          tarif: form.tarif ? Number(form.tarif) : null,
          ville: form.ville || null,
          quartier: form.quartier || null,
        }),
      };

      const response = await register(payload, role === 'PATIENT' ? visage : undefined);

      if (response.token) {
        // PATIENT : compte approuve immediatement, connexion directe.
        navigate(homeForRole(response.role));
      } else {
        // MEDECIN, INFIRMIER, DIRECTEUR : compte en attente de validation admin.
        setPendingMessage(response.message);
      }
    } catch {
      // erreur deja geree par le contexte
    }
  }

  if (pendingMessage) {
    return (
      <div className="min-h-screen bg-(--color-ivory) flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-(--color-sage-100) flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={26} className="text-(--color-sage-500)" />
          </div>
          <h1 className="font-display font-bold text-2xl text-(--color-petrol-700)">Demande envoyee</h1>
          <p className="text-(--color-ink-600) mt-3">{pendingMessage}</p>
          <Link to="/connexion" className="inline-block mt-7">
            <Button variant="ghost">Retour a la connexion</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--color-ivory) flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-(--color-ink-600) font-medium mb-6 hover:text-(--color-petrol-600) transition-colors">
          <ArrowLeft size={15} /> Retour a l'accueil
        </Link>

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-(--color-petrol-600) flex items-center justify-center text-white mb-3">
            <Stethoscope size={24} strokeWidth={2} />
          </div>
          <h1 className="font-display font-bold text-2xl text-(--color-petrol-700)">Rejoindre MediLinkPro</h1>
          <p className="text-sm text-(--color-ink-600) mt-1 text-center">
            Choisissez votre profil pour creer votre espace.
          </p>
        </div>

        {/* Selecteur de role */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {ROLES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleRoleChange(value)}
              className={`flex items-center gap-2 px-3.5 py-3 rounded-xl border text-left transition-colors ${
                role === value
                  ? 'border-(--color-petrol-600) bg-(--color-petrol-50) text-(--color-petrol-700)'
                  : 'border-(--color-petrol-100) bg-white text-(--color-ink-600) hover:border-(--color-petrol-400)'
              }`}
            >
              <Icon size={17} strokeWidth={2} className="shrink-0" />
              <span className="text-sm font-semibold">{label}</span>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-(--color-petrol-100) shadow-sm p-6">
          {role !== 'PATIENT' && (
            <div className="flex items-start gap-2 bg-(--color-amber-400)/15 text-(--color-amber-500) text-sm rounded-xl px-3.5 py-3 mb-4">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>Ce profil necessite une validation par un administrateur avant la premiere connexion.</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-(--color-clay-100) text-(--color-clay-500) text-sm rounded-xl px-3.5 py-3 mb-4">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Prenom</FieldLabel>
                <TextInput required value={form.prenom} onChange={(e) => update('prenom', e.target.value)} />
              </div>
              <div>
                <FieldLabel>Nom</FieldLabel>
                <TextInput required value={form.nom} onChange={(e) => update('nom', e.target.value)} />
              </div>
            </div>

            <div>
              <FieldLabel>Email</FieldLabel>
              <TextInput
                type="email"
                required
                placeholder="vous@exemple.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>

            <div>
              <FieldLabel>Mot de passe</FieldLabel>
              <TextInput
                type="password"
                required
                minLength={6}
                placeholder="Au moins 6 caracteres"
                value={form.motDePasse}
                onChange={(e) => update('motDePasse', e.target.value)}
              />
            </div>

            <div>
              <FieldLabel>Telephone</FieldLabel>
              <TextInput
                type="tel"
                placeholder="+237 6XX XXX XXX"
                value={form.telephone}
                onChange={(e) => update('telephone', e.target.value)}
              />
            </div>

            {role === 'PATIENT' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Date de naissance</FieldLabel>
                    <TextInput
                      type="date"
                      value={form.dateNaissance}
                      onChange={(e) => update('dateNaissance', e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel>Groupe sanguin</FieldLabel>
                    <Select value={form.groupeSanguin} onChange={(e) => update('groupeSanguin', e.target.value)}>
                      {GROUPES_SANGUINS.map((g) => (
                        <option key={g} value={g}>{GROUPE_LABELS[g]}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div>
                  <FieldLabel>Allergies connues</FieldLabel>
                  <TextInput
                    placeholder="Penicilline, arachides... (laisser vide si aucune)"
                    value={form.allergies}
                    onChange={(e) => update('allergies', e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>A signaler aux secours</FieldLabel>
                  <TextInput
                    placeholder="Asthme, diabete, epilepsie, pacemaker..."
                    value={form.conditionsUrgence}
                    onChange={(e) => update('conditionsUrgence', e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Photo du visage (obligatoire)</FieldLabel>
                  <CapturePhotoVisage onResultat={setVisage} />
                  <p className="text-xs text-(--color-ink-600) mt-1.5">
                    En cas d'accident, elle permet aux secours de retrouver votre groupe sanguin,
                    vos allergies et le numero de votre proche.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Contact d'urgence (nom)</FieldLabel>
                    <TextInput
                      placeholder="Nom d'un proche"
                      value={form.contactUrgenceNom}
                      onChange={(e) => update('contactUrgenceNom', e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel>Contact d'urgence (telephone)</FieldLabel>
                    <TextInput
                      type="tel"
                      placeholder="+237 6XX XXX XXX"
                      value={form.contactUrgenceTelephone}
                      onChange={(e) => update('contactUrgenceTelephone', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {role === 'PHARMACIEN' && (
              <>
                <div>
                  <FieldLabel>Nom de la pharmacie</FieldLabel>
                  <TextInput required placeholder="Pharmacie du Centre" value={form.nomPharmacie}
                    onChange={(e) => update('nomPharmacie', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Numero d'agrement</FieldLabel>
                    <TextInput required value={form.numeroAgrement} onChange={(e) => update('numeroAgrement', e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Ville</FieldLabel>
                    <TextInput placeholder="Yaounde" value={form.ville} onChange={(e) => update('ville', e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {role === 'MEDECIN' && (
              <>
                <div>
                  <FieldLabel>Specialite</FieldLabel>
                  <TextInput
                    required
                    placeholder="Cardiologie, pediatrie..."
                    value={form.specialite}
                    onChange={(e) => update('specialite', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Numero d'ordre</FieldLabel>
                    <TextInput
                      required
                      placeholder="CM-12345"
                      value={form.numeroOrdre}
                      onChange={(e) => update('numeroOrdre', e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel>Tarif (FCFA)</FieldLabel>
                    <TextInput
                      type="number"
                      min="0"
                      placeholder="15000"
                      value={form.tarif}
                      onChange={(e) => update('tarif', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Ville</FieldLabel>
                    <TextInput
                      placeholder="Yaounde"
                      value={form.ville}
                      onChange={(e) => update('ville', e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel>Quartier</FieldLabel>
                    <TextInput
                      placeholder="Bastos"
                      value={form.quartier}
                      onChange={(e) => update('quartier', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <Button type="submit" disabled={loading || (role === 'PATIENT' && !visage)} className="w-full">
              {loading ? 'Creation du compte...' : 'Creer mon compte'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-(--color-ink-600) mt-5">
          Deja un compte ?{' '}
          <Link to="/connexion" className="font-semibold text-(--color-petrol-600) hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
