import { useEffect, useState } from 'react';
import { UserPlus, Check, X, Building2, Mail, Phone, BadgeCheck, Send } from 'lucide-react';
import { getDemandesEnAttente, repondreDemandeIntegration } from '../../api/integration';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Spinner, EmptyState, PageHeader, Textarea } from '../../components/ui';
import PhotoInfirmier from '../../components/PhotoInfirmier';

function nomProfessionnel(d) {
  return d.typeProfessionnel === 'INFIRMIER'
    ? `${d.professionnelPrenom} ${d.professionnelNom}`
    : `Dr ${d.professionnelPrenom || d.medecinPrenom} ${d.professionnelNom || d.medecinNom}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Demandes d'adhesion de medecins et d'infirmieres aux etablissements, partagee entre Directeur
 * (ses etablissements) et Admin (tous). Les demandes initiees par un professionnel sont a valider ici ;
 * les invitations envoyees par l'etablissement attendent la reponse du medecin et sont seulement listees.
 */
export default function DemandesAdhesionPage() {
  const { user } = useAuth();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enCoursId, setEnCoursId] = useState(null);
  const [messages, setMessages] = useState({});
  const [erreur, setErreur] = useState(null);
  const [traitees, setTraitees] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getDemandesEnAttente()
      .then((data) => { if (!cancelled) setDemandes(data); })
      .catch(() => { if (!cancelled) setErreur('Impossible de charger les demandes.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function repondre(demande, accepter) {
    setEnCoursId(demande.id);
    setErreur(null);
    try {
      const maj = await repondreDemandeIntegration(demande.id, user.userId, {
        accepter,
        messageReponse: messages[demande.id] || null,
      });
      setDemandes((prev) => prev.filter((d) => d.id !== demande.id));
      setTraitees((prev) => [maj, ...prev]);
    } catch (err) {
      setErreur(err.response?.data?.message || 'La réponse n\'a pas pu être enregistrée.');
    } finally {
      setEnCoursId(null);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner className="w-7 h-7" /></div>;
  }

  const aValider = demandes.filter((d) => d.initiateur !== 'ETABLISSEMENT');
  const invitations = demandes.filter((d) => d.initiateur === 'ETABLISSEMENT');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demandes d'adhésion"
        description={user.role === 'ADMIN'
          ? 'Médecins et infirmier(e)s demandant à rejoindre un établissement de la plateforme.'
          : 'Médecins et infirmier(e)s demandant à rejoindre vos établissements.'}
      />

      {erreur && <p className="text-sm text-(--color-clay-500) bg-(--color-clay-100) rounded-xl px-4 py-3">{erreur}</p>}

      {aValider.length === 0 ? (
        <Card>
          <EmptyState icon={UserPlus} title="Aucune demande à valider" description="Les demandes envoyées par les médecins et infirmier(e)s apparaîtront ici." />
        </Card>
      ) : (
        <div className="space-y-3">
          {aValider.map((d) => (
            <Card key={d.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  {d.typeProfessionnel === 'INFIRMIER' && (
                    <PhotoInfirmier infirmierId={d.infirmierId} disponible={d.infirmierPhotoDisponible} className="w-14 h-14" />
                  )}
                  <div>
                    <p className="font-display font-semibold text-(--color-ink-900)">{nomProfessionnel(d)}</p>
                    <p className="text-sm text-(--color-amber-500) font-medium">
                      {d.typeProfessionnel === 'INFIRMIER' ? 'Infirmier(e)' : `Médecin · ${d.medecinSpecialite || 'Généraliste'}`}
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-(--color-petrol-600) bg-(--color-petrol-50) px-2.5 py-1 rounded-full">
                  <Building2 size={13} /> {d.etablissementNom}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-(--color-ink-600)">
                {d.medecinNumeroOrdre && <span className="flex items-center gap-1.5"><BadgeCheck size={14} /> Ordre n° {d.medecinNumeroOrdre}</span>}
                {d.professionnelEmail && <span className="flex items-center gap-1.5"><Mail size={14} /> {d.professionnelEmail}</span>}
                {d.professionnelTelephone && <span className="flex items-center gap-1.5"><Phone size={14} /> {d.professionnelTelephone}</span>}
                <span className="text-(--color-ink-300)">Reçue le {formatDate(d.dateCreation)}</span>
              </div>
              {d.message && (
                <p className="text-sm text-(--color-ink-600) bg-(--color-ivory) rounded-xl px-3.5 py-2.5 italic">« {d.message} »</p>
              )}
              <Textarea
                rows={2}
                placeholder="Message au professionnel (optionnel)"
                value={messages[d.id] || ''}
                onChange={(e) => setMessages((prev) => ({ ...prev, [d.id]: e.target.value }))}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="danger" disabled={enCoursId === d.id} onClick={() => repondre(d, false)}>
                  <X size={15} /> Refuser
                </Button>
                <Button disabled={enCoursId === d.id} onClick={() => repondre(d, true)}>
                  <Check size={15} /> Accepter l'adhésion
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {traitees.length > 0 && (
        <div className="space-y-1.5">
          {traitees.map((d) => (
            <p key={d.id} className={`text-sm rounded-xl px-4 py-2.5 ${d.statut === 'ACCEPTEE'
              ? 'bg-(--color-sage-100) text-(--color-sage-500)' : 'bg-(--color-clay-100) text-(--color-clay-500)'}`}>
              {nomProfessionnel(d)} — {d.statut === 'ACCEPTEE' ? `a rejoint ${d.etablissementNom}` : 'demande refusée'}
            </p>
          ))}
        </div>
      )}

      {invitations.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-(--color-ink-900) mb-3 flex items-center gap-2">
            <Send size={17} className="text-(--color-petrol-600)" /> Invitations envoyées, en attente du médecin
          </h2>
          <div className="space-y-2">
            {invitations.map((d) => (
              <Card key={d.id} className="px-5 py-3 text-sm text-(--color-ink-600) flex justify-between flex-wrap gap-2">
                <span>Dr {d.medecinPrenom} {d.medecinNom} → {d.etablissementNom}</span>
                <span className="text-(--color-ink-300)">envoyée le {formatDate(d.dateCreation)}</span>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
