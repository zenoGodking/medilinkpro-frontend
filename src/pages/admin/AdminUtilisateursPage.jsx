import { useEffect, useState } from 'react';
import { Users, Trash2, Power, Search } from 'lucide-react';
import { getTousLesUtilisateurs, supprimerUtilisateur, toggleActif } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import { Card, Spinner, EmptyState, PageHeader, Button, RoleBadge, StatutCompteBadge, Select, TextInput } from '../../components/ui';

const FILTRES_ROLE = [
  { value: '', label: 'Tous les roles' },
  { value: 'PATIENT', label: 'Patient' },
  { value: 'MEDECIN', label: 'Medecin' },
  { value: 'INFIRMIER', label: 'Infirmier(e)' },
  { value: 'DIRECTEUR', label: 'Directeur' },
  { value: 'ADMIN', label: 'Administrateur' },
];

export default function AdminUtilisateursPage() {
  const { user } = useAuth();
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreRole, setFiltreRole] = useState('');
  const [recherche, setRecherche] = useState('');
  const [confirmationId, setConfirmationId] = useState(null);
  const [enCoursId, setEnCoursId] = useState(null);
  const [erreur, setErreur] = useState(null);

  async function charger() {
    setLoading(true);
    try {
      const data = await getTousLesUtilisateurs(filtreRole || undefined);
      setUtilisateurs(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { charger(); }, [filtreRole]);

  async function handleSupprimer(id) {
    setErreur(null);
    setEnCoursId(id);
    try {
      await supprimerUtilisateur(id, user.userId);
      setUtilisateurs((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible de supprimer cet utilisateur.");
    } finally {
      setEnCoursId(null);
      setConfirmationId(null);
    }
  }

  async function handleToggleActif(id) {
    setEnCoursId(id);
    try {
      const maj = await toggleActif(id);
      setUtilisateurs((prev) => prev.map((u) => (u.id === id ? maj : u)));
    } finally {
      setEnCoursId(null);
    }
  }

  const filtres = utilisateurs.filter((u) => {
    if (!recherche.trim()) return true;
    const q = recherche.trim().toLowerCase();
    return `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tous les utilisateurs"
        description="Consultez, suspendez ou supprimez definitivement n'importe quel compte de la plateforme."
      />

      {erreur && (
        <div className="text-sm font-medium text-(--color-clay-500) bg-(--color-clay-100) rounded-xl px-3.5 py-3">
          {erreur}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-ink-300)" />
          <TextInput
            placeholder="Rechercher par nom ou email..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="sm:w-56">
          <Select value={filtreRole} onChange={(e) => setFiltreRole(e.target.value)}>
            {FILTRES_ROLE.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="w-7 h-7" /></div>
      ) : filtres.length === 0 ? (
        <Card><EmptyState icon={Users} title="Aucun utilisateur" description="Aucun compte ne correspond a ces criteres." /></Card>
      ) : (
        <div className="space-y-2.5">
          {filtres.map((u) => (
            <Card key={u.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display font-semibold text-(--color-ink-900)">{u.prenom} {u.nom}</p>
                  <RoleBadge role={u.role} />
                  <StatutCompteBadge statut={u.statutCompte} />
                  {!u.actif && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-(--color-clay-100) text-(--color-clay-500)">
                      Suspendu
                    </span>
                  )}
                </div>
                <p className="text-sm text-(--color-ink-600) mt-1">{u.email}</p>
                {u.id === user.userId && (
                  <p className="text-xs text-(--color-amber-500) font-medium mt-1">C'est votre propre compte</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  className="!px-3 !py-1.5"
                  disabled={enCoursId === u.id}
                  onClick={() => handleToggleActif(u.id)}
                >
                  <Power size={14} /> {u.actif ? 'Suspendre' : 'Reactiver'}
                </Button>

                {u.id === user.userId ? null : confirmationId === u.id ? (
                  <>
                    <span className="text-xs text-(--color-clay-500) font-medium">Confirmer ?</span>
                    <Button variant="ghost" className="!px-3 !py-1.5" onClick={() => setConfirmationId(null)}>
                      Non
                    </Button>
                    <Button
                      variant="danger"
                      className="!px-3 !py-1.5"
                      disabled={enCoursId === u.id}
                      onClick={() => handleSupprimer(u.id)}
                    >
                      {enCoursId === u.id ? '...' : 'Oui, supprimer'}
                    </Button>
                  </>
                ) : (
                  <Button variant="danger" className="!px-3 !py-1.5" onClick={() => setConfirmationId(u.id)}>
                    <Trash2 size={14} /> Supprimer
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
