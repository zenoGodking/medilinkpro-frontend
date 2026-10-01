import { useEffect, useState, useCallback } from 'react';
import { Building2, Check, X, Send, Clock, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMedecin } from '../../api/medecins';
import { getPublicEtablissements } from '../../api/etablissements';
import { demanderIntegration, repondreDemandeIntegration, getDemandesMedecin } from '../../api/integration';
import { Card, Button, Spinner, EmptyState, PageHeader, TextInput } from '../../components/ui';

const STATUT_LABELS = {
  EN_ATTENTE: { label: 'En attente', className: 'bg-(--color-amber-400)/20 text-(--color-amber-500)' },
  ACCEPTEE: { label: 'Acceptée', className: 'bg-(--color-sage-100) text-(--color-sage-500)' },
  REFUSEE: { label: 'Refusée', className: 'bg-(--color-clay-100) text-(--color-clay-500)' },
};

export default function MedecinEtablissementPage() {
  const { user } = useAuth();
  const [medecin, setMedecin] = useState(null);
  const [demandes, setDemandes] = useState([]);
  const [etablissements, setEtablissements] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(true);
  const [enCoursId, setEnCoursId] = useState(null);
  const [erreur, setErreur] = useState(null);

  const charger = useCallback(async () => {
    try {
      const [m, d, etabs] = await Promise.all([
        getMedecin(user.userId),
        getDemandesMedecin(user.userId),
        getPublicEtablissements(),
      ]);
      setMedecin(m);
      setDemandes(d);
      setEtablissements(etabs);
    } finally {
      setLoading(false);
    }
  }, [user.userId]);

  useEffect(() => { charger(); }, [charger]);

  const invitationsEnAttente = demandes.filter((d) => d.initiateur === 'ETABLISSEMENT' && d.statut === 'EN_ATTENTE');
  const historique = demandes.filter((d) => !(d.initiateur === 'ETABLISSEMENT' && d.statut === 'EN_ATTENTE'));

  async function handleRepondre(demandeId, accepter) {
    setErreur(null);
    setEnCoursId(demandeId);
    try {
      await repondreDemandeIntegration(demandeId, user.userId, { accepter });
      await charger();
    } catch {
      setErreur('Impossible de répondre à cette invitation pour le moment.');
    } finally {
      setEnCoursId(null);
    }
  }

  async function handleDemander(etablissementId) {
    setErreur(null);
    setEnCoursId(etablissementId);
    try {
      await demanderIntegration(user.userId, etablissementId);
      await charger();
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible d'envoyer la demande pour le moment.");
    } finally {
      setEnCoursId(null);
    }
  }

  const etablissementsFiltres = etablissements.filter((e) =>
    e.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner className="w-7 h-7" /></div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mon établissement"
        description="Rejoignez un établissement, ou répondez aux invitations que vous recevez."
      />

      {erreur && (
        <div className="text-sm font-medium text-(--color-clay-500) bg-(--color-clay-100) rounded-xl px-3.5 py-3">
          {erreur}
        </div>
      )}

      <Card className="p-5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-(--color-petrol-50) flex items-center justify-center shrink-0">
          <Building2 size={20} className="text-(--color-petrol-600)" />
        </div>
        <div>
          <p className="text-xs text-(--color-ink-300) font-medium uppercase tracking-wide">Établissement actuel</p>
          <p className="font-display font-semibold text-(--color-ink-900)">
            {medecin?.etablissementNom || 'Aucun établissement (praticien indépendant)'}
          </p>
        </div>
      </Card>

      {invitationsEnAttente.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-(--color-ink-900) mb-3">Invitations reçues</h2>
          <div className="space-y-3">
            {invitationsEnAttente.map((d) => (
              <Card key={d.id} className="p-4 flex flex-wrap items-center justify-between gap-3 border-(--color-amber-400)/40">
                <div>
                  <p className="font-semibold text-(--color-ink-900)">{d.etablissementNom}</p>
                  {d.message && <p className="text-sm text-(--color-ink-600) mt-0.5">"{d.message}"</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    className="!px-3 !py-1.5"
                    disabled={enCoursId === d.id}
                    onClick={() => handleRepondre(d.id, false)}
                  >
                    <X size={14} /> Refuser
                  </Button>
                  <Button
                    variant="amber"
                    className="!px-3 !py-1.5"
                    disabled={enCoursId === d.id}
                    onClick={() => handleRepondre(d.id, true)}
                  >
                    <Check size={14} /> Accepter
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-display font-semibold text-(--color-ink-900) mb-3">Demander à rejoindre un établissement</h2>
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-ink-300)" />
          <TextInput
            placeholder="Rechercher un établissement..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="pl-9"
          />
        </div>
        {etablissementsFiltres.length === 0 ? (
          <Card><EmptyState icon={Building2} title="Aucun établissement trouvé" description="Essayez une autre recherche." /></Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {etablissementsFiltres.map((e) => {
              const dejaEnvoyee = demandes.some(
                (d) => d.etablissementId === e.id && d.statut === 'EN_ATTENTE' && d.initiateur === 'MEDECIN'
              );
              const dejaMembre = medecin?.etablissementId === e.id;
              return (
                <Card key={e.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-(--color-ink-900) truncate">{e.nom}</p>
                    {e.type && <p className="text-xs text-(--color-amber-500)">{e.type}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    className="!px-3 !py-1.5 shrink-0"
                    disabled={dejaEnvoyee || dejaMembre || enCoursId === e.id}
                    onClick={() => handleDemander(e.id)}
                  >
                    <Send size={13} />
                    {dejaMembre ? 'Membre' : dejaEnvoyee ? 'Demande envoyée' : 'Demander'}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {historique.length > 0 && (
        <div>
          <h2 className="flex items-center gap-1.5 font-display font-semibold text-(--color-ink-900) mb-3">
            <Clock size={16} /> Historique
          </h2>
          <div className="space-y-2">
            {historique.map((d) => (
              <Card key={d.id} className="p-3.5 flex items-center justify-between gap-3">
                <p className="text-sm text-(--color-ink-900)">{d.etablissementNom}</p>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUT_LABELS[d.statut]?.className}`}>
                  {STATUT_LABELS[d.statut]?.label || d.statut}
                </span>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
