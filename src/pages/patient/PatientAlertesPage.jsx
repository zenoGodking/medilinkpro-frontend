import { useCallback, useEffect, useMemo, useState } from 'react';
import { BellRing, MapPin, MessageSquare, Send, X, Clock, UserCheck, History, Star, RefreshCw, ClipboardCheck, Phone, Navigation, LocateOff } from 'lucide-react';
import { creerAlerte, annulerAlerte, noterAlerte, getMesAlertes, getSuiviInfirmier } from '../../api/alertes';
import { lirePositionActuelle } from '../../hooks/usePositionGps';
import CarteSuivi from '../../components/CarteSuivi';
import ProfilInfirmierCard from '../../components/ProfilInfirmierCard';
import { getToken } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useAlerteSocket } from '../../hooks/useAlerteSocket';
import { Card, Button, TextInput, FieldLabel, Textarea, Spinner, PageHeader, EmptyState } from '../../components/ui';

const STATUT_META = {
  EN_ATTENTE: { label: "En attente d'une infirmière", className: 'bg-(--color-amber-400)/20 text-(--color-amber-500)' },
  REPONDUE: { label: 'En cours', className: 'bg-(--color-sage-100) text-(--color-sage-500)' },
  SERVICE_RENDU: { label: 'À noter', className: 'bg-(--color-amber-400)/20 text-(--color-amber-500)' },
  TERMINEE: { label: 'Terminée', className: 'bg-(--color-petrol-100) text-(--color-petrol-600)' },
  ANNULEE: { label: 'Annulée', className: 'bg-(--color-clay-100) text-(--color-clay-500)' },
};

const STATUTS_EN_COURS = ['EN_ATTENTE', 'REPONDUE', 'SERVICE_RENDU'];

function formatDateHeure(iso) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function EtoilesNotation({ valeur, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} etoile${n > 1 ? 's' : ''}`}
          className="p-0.5"
        >
          <Star
            size={26}
            className={n <= valeur ? 'fill-(--color-amber-400) text-(--color-amber-400)' : 'text-(--color-petrol-100)'}
          />
        </button>
      ))}
    </div>
  );
}

export default function PatientAlertesPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ adresse: '', message: '' });
  const [alerteEnCours, setAlerteEnCours] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [loadingHistorique, setLoadingHistorique] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [infoRetractation, setInfoRetractation] = useState(false);
  const [notation, setNotation] = useState({ note: 0, commentaire: '' });
  const [envoiNotation, setEnvoiNotation] = useState(false);
  const [localisation, setLocalisation] = useState(false);
  const [sansPosition, setSansPosition] = useState(false);
  // Position en temps reel de l'infirmiere en route (statut REPONDUE uniquement).
  const [suivi, setSuivi] = useState(null);
  const token = useMemo(() => getToken(), []);

  const chargerHistorique = useCallback(async () => {
    try {
      const data = await getMesAlertes(user.userId);
      setHistorique(data);
      const active = data.find((a) => STATUTS_EN_COURS.includes(a.statut));
      setAlerteEnCours(active || null);
    } finally {
      setLoadingHistorique(false);
    }
  }, [user.userId]);

  useEffect(() => { chargerHistorique(); }, [chargerHistorique]);

  const onAlerteMiseAJour = useCallback((alerte) => {
    setAlerteEnCours((prev) => {
      if (!prev || prev.id !== alerte.id) return prev;
      // L'infirmiere s'est retractee : l'alerte repasse de REPONDUE a EN_ATTENTE.
      if (prev.statut === 'REPONDUE' && alerte.statut === 'EN_ATTENTE') {
        setInfoRetractation(true);
        setTimeout(() => setInfoRetractation(false), 6000);
      }
      return alerte;
    });
    setHistorique((prev) => prev.map((a) => (a.id === alerte.id ? alerte : a)));
  }, []);

  const onSuivi = useCallback((position) => {
    setSuivi((prev) => (prev && prev.alerteId !== position.alerteId ? prev : position));
  }, []);

  const subscriptions = useMemo(
    () => [
      { destination: '/user/queue/alertes', onMessage: onAlerteMiseAJour },
      { destination: '/user/queue/suivi', onMessage: onSuivi },
    ],
    [onAlerteMiseAJour, onSuivi]
  );
  useAlerteSocket(token, subscriptions);

  // Des qu'une infirmiere a accepte : derniere position connue, puis mises a jour via WebSocket.
  const alerteSuivieId = alerteEnCours?.statut === 'REPONDUE' ? alerteEnCours.id : null;
  useEffect(() => {
    if (!alerteSuivieId) return;
    getSuiviInfirmier(alerteSuivieId).then(setSuivi).catch(() => {});
  }, [alerteSuivieId]);
  // Ignore une position residuelle d'une intervention precedente.
  const suiviActif = alerteSuivieId && suivi?.alerteId === alerteSuivieId ? suivi : null;

  async function handleEnvoyer(e) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);
    // La position permet de prevenir d'abord les infirmieres les plus proches ; sans elle,
    // l'alerte part quand meme, a toutes les infirmieres connectees.
    setLocalisation(true);
    const position = await lirePositionActuelle().catch(() => null);
    setLocalisation(false);
    setSansPosition(!position);
    try {
      const alerte = await creerAlerte(user.userId, {
        adresse: form.adresse,
        message: form.message || null,
        latitude: position?.latitude ?? null,
        longitude: position?.longitude ?? null,
      });
      setAlerteEnCours(alerte);
      setHistorique((prev) => [alerte, ...prev]);
      setForm({ adresse: '', message: '' });
    } catch {
      setErreur("Impossible d'envoyer l'alerte pour le moment. Réessayez.");
    } finally {
      setEnvoi(false);
    }
  }

  async function handleAnnuler() {
    if (!alerteEnCours) return;
    try {
      const alerte = await annulerAlerte(alerteEnCours.id, user.userId);
      setAlerteEnCours(alerte);
      setHistorique((prev) => prev.map((a) => (a.id === alerte.id ? alerte : a)));
    } catch {
      setErreur("Impossible d'annuler l'alerte pour le moment.");
    }
  }

  async function handleNoter(e) {
    e.preventDefault();
    if (!alerteEnCours || notation.note === 0) return;
    setEnvoiNotation(true);
    setErreur(null);
    try {
      const alerte = await noterAlerte(alerteEnCours.id, user.userId, {
        note: notation.note,
        commentaire: notation.commentaire || null,
      });
      setHistorique((prev) => prev.map((a) => (a.id === alerte.id ? alerte : a)));
      setAlerteEnCours(null);
      setNotation({ note: 0, commentaire: '' });
    } catch {
      setErreur("Impossible d'enregistrer votre note pour le moment.");
    } finally {
      setEnvoiNotation(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Soins à domicile"
        description="Envoyez une alerte : les infirmières disponibles les plus proches de vous sont prévenues instantanément."
      />

      {infoRetractation && (
        <div className="flex items-center gap-2 bg-(--color-amber-400)/20 text-(--color-amber-500) text-sm font-medium rounded-xl px-4 py-3">
          <RefreshCw size={15} /> L'infirmière s'est désistée suite à un imprévu. Votre alerte est de nouveau proposée aux infirmières.
        </div>
      )}
      {erreur && (
        <div className="text-sm font-medium text-(--color-clay-500) bg-(--color-clay-100) rounded-xl px-3.5 py-3">
          {erreur}
        </div>
      )}

      {alerteEnCours && STATUTS_EN_COURS.includes(alerteEnCours.statut) ? (
        <Card
          className={`p-6 sm:p-8 ${
            alerteEnCours.statut === 'EN_ATTENTE' ? 'border-(--color-amber-400)/50' : 'border-(--color-sage-500)/40'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                alerteEnCours.statut === 'EN_ATTENTE' ? 'bg-(--color-amber-400)/20' : 'bg-(--color-sage-100)'
              }`}
            >
              {alerteEnCours.statut === 'EN_ATTENTE' ? (
                <BellRing size={20} className="text-(--color-amber-500) animate-pulse" />
              ) : alerteEnCours.statut === 'REPONDUE' ? (
                <UserCheck size={20} className="text-(--color-sage-500)" />
              ) : (
                <ClipboardCheck size={20} className="text-(--color-sage-500)" />
              )}
            </div>
            <div>
              <p className="font-display font-semibold text-(--color-ink-900)">
                {alerteEnCours.statut === 'EN_ATTENTE' && "Votre alerte a été envoyée"}
                {alerteEnCours.statut === 'REPONDUE' && 'Alerte répondue !'}
                {alerteEnCours.statut === 'SERVICE_RENDU' && 'Intervention terminée'}
              </p>
              <p className="text-sm text-(--color-ink-600)">
                {alerteEnCours.statut === 'EN_ATTENTE' && (
                  alerteEnCours.diffusionGenerale
                    ? "Proposée à toutes les infirmières connectées. En attente d'une réponse..."
                    : `Proposée aux ${alerteEnCours.nombreInfirmiersNotifies} infirmières les plus proches de vous. Si aucune ne répond, la recherche s'élargit automatiquement.`
                )}
                {alerteEnCours.statut === 'REPONDUE' &&
                  `${alerteEnCours.infirmierPrenom} ${alerteEnCours.infirmierNom}, infirmier(e), a répondu présent et arrive.`}
                {alerteEnCours.statut === 'SERVICE_RENDU' &&
                  `${alerteEnCours.infirmierPrenom} ${alerteEnCours.infirmierNom} a terminé le soin. Vous pouvez noter l'intervention.`}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-1.5 text-sm text-(--color-ink-600)">
            <MapPin size={14} className="mt-0.5 shrink-0" /> {alerteEnCours.adresse}
          </div>

          {alerteEnCours.statut === 'EN_ATTENTE' && sansPosition && (
            <div className="mt-4 flex items-start gap-2 text-sm text-(--color-ink-600) bg-(--color-petrol-50) rounded-xl px-4 py-3">
              <LocateOff size={15} className="mt-0.5 shrink-0" />
              Votre position n'a pas pu être lue : l'alerte a été envoyée à toutes les infirmières.
              Autorisez la localisation la prochaine fois pour prévenir les plus proches en priorité.
            </div>
          )}

          {alerteEnCours.statut === 'REPONDUE' && (
            <div className="mt-5 space-y-3">
              {alerteEnCours.infirmierId && <ProfilInfirmierCard infirmierId={alerteEnCours.infirmierId} />}
              {alerteEnCours.infirmierTelephone && (
                <a
                  href={`tel:${alerteEnCours.infirmierTelephone}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-(--color-petrol-600) text-white px-4 py-3 hover:bg-(--color-petrol-700) transition-colors"
                >
                  <span>
                    <span className="block text-xs text-white/80">Appeler {alerteEnCours.infirmierPrenom}</span>
                    <span className="font-semibold">{alerteEnCours.infirmierTelephone}</span>
                  </span>
                  <Phone size={20} />
                </a>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-semibold text-(--color-ink-900)">
                  <Navigation size={15} className="text-(--color-amber-500)" /> Suivi en temps réel
                </span>
                {suiviActif?.distanceKm != null && (
                  <span className="text-(--color-ink-600)">a {suiviActif.distanceKm.toLocaleString('fr-FR')} km de vous</span>
                )}
              </div>
              {suiviActif?.latitude ? (
                <CarteSuivi
                  patient={alerteEnCours.latitude ? { latitude: alerteEnCours.latitude, longitude: alerteEnCours.longitude } : null}
                  infirmiere={suiviActif}
                />
              ) : (
                <p className="text-sm text-(--color-ink-600) bg-(--color-petrol-50) rounded-xl px-4 py-3">
                  La position de l'infirmière s'affichera ici dès qu'elle sera partagée.
                </p>
              )}
            </div>
          )}

          {alerteEnCours.statut === 'EN_ATTENTE' && (
            <Button variant="danger" className="mt-5" onClick={handleAnnuler}>
              <X size={15} /> Annuler l'alerte
            </Button>
          )}

          {alerteEnCours.statut === 'REPONDUE' && (
            <div className="mt-5 flex items-center gap-2 text-sm text-(--color-ink-600) bg-(--color-petrol-50) rounded-xl px-4 py-3">
              <ClipboardCheck size={15} className="shrink-0 text-(--color-petrol-400)" />
              Vous pourrez noter l'intervention dès que l'infirmière aura envoyé son compte-rendu.
            </div>
          )}

          {alerteEnCours.statut === 'SERVICE_RENDU' && (
            <div className="mt-6 pt-6 border-t border-(--color-petrol-100) space-y-4">
              {alerteEnCours.infirmierId && <ProfilInfirmierCard infirmierId={alerteEnCours.infirmierId} />}
              {alerteEnCours.compteRendu && (
                <div className="bg-(--color-petrol-50) rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-(--color-petrol-600) uppercase tracking-wide mb-1">
                    Compte-rendu de l'infirmière
                  </p>
                  <p className="text-sm text-(--color-ink-600)">{alerteEnCours.compteRendu}</p>
                </div>
              )}
              <form onSubmit={handleNoter} className="space-y-3">
                <p className="text-sm font-semibold text-(--color-ink-900)">Notez l'intervention :</p>
                <EtoilesNotation valeur={notation.note} onChange={(n) => setNotation((prev) => ({ ...prev, note: n }))} />
                <Textarea
                  rows={2}
                  placeholder="Un commentaire (optionnel)..."
                  value={notation.commentaire}
                  onChange={(e) => setNotation((prev) => ({ ...prev, commentaire: e.target.value }))}
                />
                <Button type="submit" variant="amber" disabled={notation.note === 0 || envoiNotation} className="w-full">
                  {envoiNotation ? 'Envoi...' : 'Terminer et noter'}
                </Button>
              </form>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-6 sm:p-8">
          <form onSubmit={handleEnvoyer} className="space-y-4">
            <div>
              <FieldLabel>Adresse d'intervention</FieldLabel>
              <TextInput
                required
                placeholder="Ex: Quartier Bastos, rue 1.234, Yaoundé"
                value={form.adresse}
                onChange={(e) => setForm((prev) => ({ ...prev, adresse: e.target.value }))}
              />
            </div>
            <div>
              <FieldLabel>Message (optionnel)</FieldLabel>
              <Textarea
                rows={3}
                placeholder="Décrivez brièvement le soin nécessaire..."
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              />
            </div>
            <Button type="submit" variant="amber" disabled={envoi} className="w-full">
              <Send size={15} />
              {localisation ? 'Localisation...' : envoi ? 'Envoi en cours...' : "Envoyer l'alerte aux infirmières proches"}
            </Button>
          </form>
        </Card>
      )}

      <div>
        <h2 className="flex items-center gap-1.5 font-display font-semibold text-(--color-ink-900) mb-3">
          <History size={16} /> Historique
        </h2>
        {loadingHistorique ? (
          <div className="flex justify-center py-10"><Spinner className="w-6 h-6" /></div>
        ) : historique.length === 0 ? (
          <Card><EmptyState icon={BellRing} title="Aucune alerte envoyée" description="Votre historique d'alertes apparaîtra ici." /></Card>
        ) : (
          <div className="space-y-2.5">
            {historique.map((a) => (
              <Card key={a.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-(--color-ink-900) flex items-center gap-1.5">
                      <MapPin size={13} /> {a.adresse}
                    </p>
                    {a.message && (
                      <p className="text-xs text-(--color-ink-600) flex items-center gap-1.5 mt-1">
                        <MessageSquare size={12} /> {a.message}
                      </p>
                    )}
                    <p className="text-xs text-(--color-ink-300) flex items-center gap-1.5 mt-1">
                      <Clock size={12} /> {formatDateHeure(a.dateCreation)}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUT_META[a.statut]?.className}`}>
                    {STATUT_META[a.statut]?.label || a.statut}
                  </span>
                </div>
                {a.statut === 'TERMINEE' && a.note && (
                  <div className="mt-2.5 pt-2.5 border-t border-(--color-petrol-100) flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={13}
                        className={n <= a.note ? 'fill-(--color-amber-400) text-(--color-amber-400)' : 'text-(--color-petrol-100)'}
                      />
                    ))}
                    {a.commentaire && <span className="text-xs text-(--color-ink-600) italic ml-1">"{a.commentaire}"</span>}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
