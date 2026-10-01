import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, MessageSquare, Send, Clock, AlertCircle,
  ArrowLeft, CheckCircle2, FileText, Loader2, UserRound, Pill, Gauge,
} from 'lucide-react';
import { getTeleconsultation, cloturerTeleconsultation } from '../../api/teleconsultation';
import { estConnexionLente } from '../../hooks/useReseau';
import { getToken } from '../../api/client';
import { useAlerteSocket } from '../../hooks/useAlerteSocket';
import { Card, Button, Spinner, FieldLabel, TextInput, Textarea } from '../../components/ui';

// Serveurs STUN/TURN : surchargeables par VITE_ICE_SERVERS (JSON). Un serveur TURN est
// recommande en production pour les reseaux mobiles/NAT stricts ou le pair-a-pair echoue.
function iceServers() {
  try {
    const conf = import.meta.env.VITE_ICE_SERVERS;
    if (conf) return JSON.parse(conf);
  } catch {
    // configuration invalide : valeurs par defaut
  }
  return [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
}

function formatHeure(iso) {
  return new Date(iso).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

const LIBELLES_ETAT = {
  attente: 'En attente de votre correspondant...',
  connexion: 'Connexion en cours...',
  'en-cours': 'En communication',
  parti: 'Votre correspondant a quitté la salle',
  coupe: 'Connexion interrompue, tentative de reconnexion...',
};

/** Compte rendu de la teleconsultation, avec ordonnance facultative (envoyee au patient). */
function FormulaireCompteRendu({ onEnregistrer }) {
  const [form, setForm] = useState({ motif: '', diagnostic: '', compteRendu: '', medicaments: '', posologie: '' });
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);
  const maj = (champ) => (e) => setForm((f) => ({ ...f, [champ]: e.target.value }));

  async function soumettre(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      await onEnregistrer({
        motif: form.motif || null,
        diagnostic: form.diagnostic || null,
        compteRendu: form.compteRendu,
        medicaments: form.medicaments || null,
        posologie: form.posologie || null,
      });
    } catch (err) {
      setErreur(err.response?.data?.message || "L'enregistrement a échoué.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="space-y-3">
      <p className="font-display font-semibold text-(--color-ink-900) flex items-center gap-2"><FileText size={17} /> Compte rendu et ordonnance</p>
      <div>
        <FieldLabel>Motif</FieldLabel>
        <TextInput value={form.motif} onChange={maj('motif')} maxLength={255} placeholder="Ex : fièvre depuis 3 jours" />
      </div>
      <div>
        <FieldLabel>Diagnostic</FieldLabel>
        <Textarea rows={2} value={form.diagnostic} onChange={maj('diagnostic')} maxLength={4000} />
      </div>
      <div>
        <FieldLabel>Compte rendu (obligatoire)</FieldLabel>
        <Textarea rows={4} required value={form.compteRendu} onChange={maj('compteRendu')} maxLength={8000} />
      </div>
      <div className="rounded-xl border border-(--color-petrol-100) p-3 space-y-3">
        <p className="text-sm font-semibold text-(--color-ink-900) flex items-center gap-1.5"><Pill size={15} /> Ordonnance (facultative)</p>
        <div>
          <FieldLabel>Médicaments</FieldLabel>
          <Textarea rows={3} value={form.medicaments} onChange={maj('medicaments')} maxLength={4000} placeholder="Un médicament par ligne" />
        </div>
        <div>
          <FieldLabel>Posologie</FieldLabel>
          <Textarea rows={2} value={form.posologie} onChange={maj('posologie')} maxLength={4000} placeholder="Ex : 1 comprimé matin et soir pendant 5 jours" />
        </div>
      </div>
      {erreur && <p className="text-sm text-(--color-clay-500)">{erreur}</p>}
      <Button type="submit" className="w-full" disabled={envoi || !form.compteRendu.trim()}>
        {envoi ? 'Enregistrement...' : form.medicaments.trim() ? 'Enregistrer et envoyer l\'ordonnance' : 'Enregistrer le compte rendu'}
      </Button>
      <p className="text-xs text-(--color-ink-600)">Le rendez-vous sera marqué comme terminé et le patient notifié.</p>
    </form>
  );
}

function ConfirmationCloture({ cloture }) {
  return (
    <p className="flex items-center gap-2 text-sm font-medium rounded-2xl bg-(--color-sage-100) text-(--color-sage-500) px-4 py-3">
      <CheckCircle2 size={17} />
      Compte rendu enregistré{cloture.ordonnance ? ' et ordonnance envoyée au patient (QR code vérifiable en pharmacie)' : ''}.
    </p>
  );
}

/**
 * Salle de teleconsultation video (WebRTC pair-a-pair). La signalisation passe par le WebSocket
 * STOMP du backend (/app/teleconsultation/{id}/signal -> /user/queue/teleconsultation).
 * Pour eviter les offres croisees, seul le medecin cree les offres : a chaque arrivee du patient
 * ("join") ou reponse a sa propre arrivee ("ready"), il ouvre une nouvelle session identifiee.
 */
export default function TeleconsultationPage() {
  const { rendezVousId } = useParams();
  const navigate = useNavigate();

  const [infos, setInfos] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [mediaPret, setMediaPret] = useState(false);
  const [mediaErreur, setMediaErreur] = useState(null);
  const [etat, setEtat] = useState('attente');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [camDistante, setCamDistante] = useState(true);
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState('');
  const [chatOuvert, setChatOuvert] = useState(false);
  const [nonLus, setNonLus] = useState(0);
  const [termine, setTermine] = useState(false);
  const [cameraDisponible, setCameraDisponible] = useState(false);
  const [videoAllegee, setVideoAllegee] = useState(() => estConnexionLente());
  const [panneauCompteRendu, setPanneauCompteRendu] = useState(false);
  const [cloture, setCloture] = useState(null);
  const [ordonnanceRecue, setOrdonnanceRecue] = useState(null);

  const videoLocaleRef = useRef(null);
  const videoDistanteRef = useRef(null);
  const fluxLocalRef = useRef(null);
  const pcRef = useRef(null);
  const sessionRef = useRef(null);
  const iceEnAttenteRef = useRef([]);
  const publishRef = useRef(null);
  const handlerRef = useRef(() => {});
  const chatOuvertRef = useRef(false);
  const estMedecinRef = useRef(false);
  const lancerOffreRef = useRef(null);
  const estMedecin = infos?.monRole === 'MEDECIN';

  useEffect(() => { chatOuvertRef.current = chatOuvert; }, [chatOuvert]);
  useEffect(() => { estMedecinRef.current = estMedecin; }, [estMedecin]);

  // ---------------------------------------------------------------- Chargement de la salle
  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      setInfos(await getTeleconsultation(rendezVousId));
    } catch (err) {
      setErreur(err.response?.data?.message || 'Téléconsultation introuvable.');
    } finally {
      setChargement(false);
    }
  }, [rendezVousId]);

  useEffect(() => {
    let annule = false;
    getTeleconsultation(rendezVousId)
      .then((d) => { if (!annule) setInfos(d); })
      .catch((err) => { if (!annule) setErreur(err.response?.data?.message || 'Téléconsultation introuvable.'); })
      .finally(() => { if (!annule) setChargement(false); });
    return () => { annule = true; };
  }, [rendezVousId]);

  // ---------------------------------------------------------------- Camera / micro
  useEffect(() => {
    if (!infos?.ouverte) return undefined;
    let annule = false;
    async function demarrer() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMediaErreur("Votre navigateur n'autorise pas la caméra ici (une connexion HTTPS est nécessaire).");
        setMediaPret(true);
        return;
      }
      let flux = null;
      try {
        const video = estConnexionLente()
          ? { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 12, max: 15 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } };
        flux = await navigator.mediaDevices.getUserMedia({ video, audio: { echoCancellation: true, noiseSuppression: true } });
      } catch {
        try {
          flux = await navigator.mediaDevices.getUserMedia({ audio: true });
          setCamOn(false);
          setMediaErreur('Caméra indisponible : la consultation se fera en audio.');
        } catch {
          setMediaErreur("Accès à la caméra et au micro refusé. Autorisez-les dans votre navigateur puis rechargez la page.");
        }
      }
      if (annule) {
        flux?.getTracks().forEach((t) => t.stop());
        return;
      }
      fluxLocalRef.current = flux;
      setCameraDisponible(Boolean(flux?.getVideoTracks().length));
      if (videoLocaleRef.current && flux) videoLocaleRef.current.srcObject = flux;
      setMediaPret(true);
    }
    demarrer();
    return () => {
      annule = true;
      fluxLocalRef.current?.getTracks().forEach((t) => t.stop());
      fluxLocalRef.current = null;
    };
  }, [infos?.ouverte]);

  // ---------------------------------------------------------------- WebRTC
  const envoyer = useCallback((type, data) => {
    publishRef.current?.(`/app/teleconsultation/${rendezVousId}/signal`, { type, data });
  }, [rendezVousId]);

  const fermerPc = useCallback(() => {
    const pc = pcRef.current;
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.close();
    }
    pcRef.current = null;
    if (videoDistanteRef.current) videoDistanteRef.current.srcObject = null;
  }, []);

  const nouvellePc = useCallback((sessionId) => {
    fermerPc();
    const pc = new RTCPeerConnection({ iceServers: iceServers() });
    sessionRef.current = sessionId;
    iceEnAttenteRef.current = [];
    fluxLocalRef.current?.getTracks().forEach((t) => pc.addTrack(t, fluxLocalRef.current));
    // Recevoir la video meme si l'on n'envoie que de l'audio
    if (!fluxLocalRef.current?.getVideoTracks().length) pc.addTransceiver('video', { direction: 'recvonly' });
    if (!fluxLocalRef.current?.getAudioTracks().length) pc.addTransceiver('audio', { direction: 'recvonly' });

    pc.ontrack = (e) => {
      if (videoDistanteRef.current && e.streams[0]) videoDistanteRef.current.srcObject = e.streams[0];
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) envoyer('ice', { sessionId, candidate: e.candidate.toJSON() });
    };
    pc.onconnectionstatechange = () => {
      if (pcRef.current !== pc) return;
      if (pc.connectionState === 'connected') setEtat('en-cours');
      if (pc.connectionState === 'disconnected') setEtat('coupe');
      if (pc.connectionState === 'failed') {
        setEtat('coupe');
        // Le medecin relance une session ; le patient la recevra comme une nouvelle offre.
        if (estMedecinRef.current) lancerOffreRef.current?.();
      }
    };
    pcRef.current = pc;
    setEtat('connexion');
    return pc;
  }, [envoyer, fermerPc]);

  const appliquerIceEnAttente = useCallback(async (pc) => {
    const enAttente = iceEnAttenteRef.current;
    iceEnAttenteRef.current = [];
    for (const c of enAttente) {
      try { await pc.addIceCandidate(c); } catch { /* candidat obsolete */ }
    }
  }, []);

  const lancerOffre = useCallback(async () => {
    const sessionId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    const pc = nouvellePc(sessionId);
    const offre = await pc.createOffer();
    await pc.setLocalDescription(offre);
    if (pcRef.current !== pc) return;
    envoyer('offer', { sessionId, description: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } });
  }, [envoyer, nouvellePc]);
  useEffect(() => { lancerOffreRef.current = lancerOffre; }, [lancerOffre]);

  // Le gestionnaire est relu a chaque message (ref) : il voit toujours l'etat courant.
  useEffect(() => {
    handlerRef.current = async (msg) => {
      if (!msg || msg.rendezVousId !== rendezVousId) return;
      const { type, data } = msg;
      try {
        switch (type) {
          case 'join':
            if (estMedecinRef.current) await lancerOffre();
            else envoyer('ready');
            break;
          case 'ready':
            if (estMedecinRef.current) await lancerOffre();
            break;
          case 'offer': {
            if (estMedecinRef.current) break;
            const pc = nouvellePc(data.sessionId);
            await pc.setRemoteDescription(data.description);
            await appliquerIceEnAttente(pc);
            const reponse = await pc.createAnswer();
            await pc.setLocalDescription(reponse);
            if (pcRef.current !== pc) break;
            envoyer('answer', { sessionId: data.sessionId, description: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } });
            envoyer('media', { video: !!fluxLocalRef.current?.getVideoTracks().some((t) => t.enabled) });
            break;
          }
          case 'answer': {
            const pc = pcRef.current;
            if (!estMedecinRef.current || !pc || data.sessionId !== sessionRef.current || pc.signalingState !== 'have-local-offer') break;
            await pc.setRemoteDescription(data.description);
            await appliquerIceEnAttente(pc);
            envoyer('media', { video: !!fluxLocalRef.current?.getVideoTracks().some((t) => t.enabled) });
            break;
          }
          case 'ice': {
            const pc = pcRef.current;
            if (!pc || data.sessionId !== sessionRef.current) break;
            if (pc.remoteDescription) await pc.addIceCandidate(data.candidate);
            else iceEnAttenteRef.current.push(data.candidate);
            break;
          }
          case 'leave':
            fermerPc();
            setEtat('parti');
            break;
          case 'media':
            setCamDistante(!!data?.video);
            break;
          case 'ordonnance':
            setOrdonnanceRecue(data || {});
            break;
          case 'chat':
            setMessages((prev) => [...prev, { moi: false, texte: data?.texte || '', a: new Date() }]);
            if (!chatOuvertRef.current) setNonLus((n) => n + 1);
            break;
          default:
        }
      } catch {
        // Session concurrente remplacee entre-temps : la suivante prendra le relais.
      }
    };
  }, [rendezVousId, envoyer, lancerOffre, nouvellePc, fermerPc, appliquerIceEnAttente]);

  const abonnements = useMemo(() => [
    { destination: '/user/queue/teleconsultation', onMessage: (m) => handlerRef.current(m) },
  ], []);
  const { connected, publish } = useAlerteSocket(mediaPret && infos?.ouverte && !termine ? getToken() : null, abonnements);
  useEffect(() => { publishRef.current = publish; }, [publish]);

  // A chaque (re)connexion au canal, on annonce sa presence.
  useEffect(() => {
    if (connected) envoyer('join');
  }, [connected, envoyer]);

  // Quitter proprement la salle (fermeture d'onglet, navigation).
  useEffect(() => {
    const auRevoir = () => envoyer('leave');
    window.addEventListener('beforeunload', auRevoir);
    return () => {
      window.removeEventListener('beforeunload', auRevoir);
      auRevoir();
      fermerPc();
    };
  }, [envoyer, fermerPc]);

  // ---------------------------------------------------------------- Actions
  function basculerMicro() {
    const pistes = fluxLocalRef.current?.getAudioTracks() || [];
    pistes.forEach((t) => { t.enabled = !micOn; });
    setMicOn(!micOn);
  }

  function basculerCamera() {
    const pistes = fluxLocalRef.current?.getVideoTracks() || [];
    if (pistes.length === 0) return;
    pistes.forEach((t) => { t.enabled = !camOn; });
    envoyer('media', { video: !camOn });
    setCamOn(!camOn);
  }

  function envoyerMessage(e) {
    e.preventDefault();
    const t = texte.trim();
    if (!t) return;
    envoyer('chat', { texte: t.slice(0, 2000) });
    setMessages((prev) => [...prev, { moi: true, texte: t, a: new Date() }]);
    setTexte('');
  }

  // Video allegee : resolution et debit reduits pour les reseaux 2G/3G (l'audio reste prioritaire).
  async function appliquerVideoAllegee(active) {
    setVideoAllegee(active);
    const piste = fluxLocalRef.current?.getVideoTracks()[0];
    try {
      await piste?.applyConstraints(active
        ? { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 12, max: 15 } }
        : { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } });
      const emetteur = pcRef.current?.getSenders().find((x) => x.track?.kind === 'video');
      if (emetteur) {
        const parametres = emetteur.getParameters();
        if (!parametres.encodings?.length) parametres.encodings = [{}];
        parametres.encodings[0].maxBitrate = active ? 150000 : undefined;
        await emetteur.setParameters(parametres);
      }
    } catch {
      // Navigateur sans reglage fin : on garde la qualite actuelle.
    }
  }

  async function enregistrerCompteRendu(formulaire) {
    const r = await cloturerTeleconsultation(rendezVousId, formulaire);
    setCloture(r);
    setPanneauCompteRendu(false);
    envoyer('ordonnance', { ordonnance: Boolean(r.ordonnance) });
    return r;
  }

  function raccrocher() {
    envoyer('leave');
    fermerPc();
    fluxLocalRef.current?.getTracks().forEach((t) => t.stop());
    setTermine(true);
  }


  // ---------------------------------------------------------------- Rendu
  if (chargement) {
    return <div className="flex justify-center py-20"><Spinner className="w-7 h-7" /></div>;
  }

  const retour = estMedecin ? '/medecin/agenda' : '/patient/rendez-vous';

  if (erreur || !infos) {
    return (
      <Card className="p-8 max-w-lg mx-auto text-center">
        <AlertCircle size={32} className="mx-auto text-(--color-clay-500) mb-3" />
        <p className="text-(--color-ink-900) font-medium">{erreur}</p>
        <Link to="/" className="text-sm text-(--color-petrol-600) underline mt-3 inline-block">Retour</Link>
      </Card>
    );
  }

  const correspondant = estMedecin ? infos.patientNomComplet : `Dr ${infos.medecinNomComplet}`;

  if (!infos.ouverte) {
    return (
      <Card className="p-8 max-w-lg mx-auto text-center space-y-3">
        <Clock size={32} className="mx-auto text-(--color-petrol-400)" />
        <p className="font-display font-semibold text-lg text-(--color-ink-900)">Téléconsultation avec {correspondant}</p>
        <p className="text-sm text-(--color-ink-600) capitalize">{formatHeure(infos.dateHeure)}</p>
        <p className="text-sm bg-(--color-petrol-50) text-(--color-petrol-600) rounded-xl px-4 py-3">{infos.raison}</p>
        <div className="flex justify-center gap-2 pt-2">
          <Link to={retour}><Button variant="ghost"><ArrowLeft size={15} /> Retour</Button></Link>
          <Button onClick={charger}>Réessayer</Button>
        </div>
      </Card>
    );
  }

  if (termine) {
    return (
      <Card className="p-8 max-w-lg mx-auto text-center space-y-3">
        <CheckCircle2 size={36} className="mx-auto text-(--color-sage-500)" />
        <p className="font-display font-semibold text-lg text-(--color-ink-900)">Vous avez quitté la téléconsultation</p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Button variant="ghost" onClick={() => { setTermine(false); setMediaPret(false); charger(); }}>Rejoindre à nouveau</Button>
          {estMedecin ? (
            cloture ? (
              <Button onClick={() => navigate(`/medecin/patients/${infos.patientId}`)}><FileText size={15} /> Ouvrir le carnet du patient</Button>
            ) : null
          ) : (
            <Link to={retour}><Button>Mes rendez-vous</Button></Link>
          )}
        </div>
        {estMedecin && !cloture && (
          <div className="text-left pt-4 border-t border-(--color-petrol-100)">
            <FormulaireCompteRendu onEnregistrer={enregistrerCompteRendu} />
          </div>
        )}
        {estMedecin && cloture && <ConfirmationCloture cloture={cloture} />}
      </Card>
    );
  }

  const enCommunication = etat === 'en-cours';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-(--color-petrol-700)">Téléconsultation · {correspondant}</h1>
          <p className="text-sm text-(--color-ink-600) capitalize">
            {formatHeure(infos.dateHeure)}{infos.specialiteMedecin && !estMedecin ? ` · ${infos.specialiteMedecin}` : ''}
          </p>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${enCommunication
          ? 'bg-(--color-sage-100) text-(--color-sage-500)' : 'bg-(--color-amber-400)/20 text-(--color-amber-500)'}`}>
          {!enCommunication && <Loader2 size={13} className="animate-spin" />}
          {connected ? LIBELLES_ETAT[etat] : 'Connexion au serveur...'}
        </span>
      </div>

      {mediaErreur && (
        <p className="flex items-start gap-2 text-sm bg-(--color-clay-100) text-(--color-clay-500) rounded-xl px-4 py-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {mediaErreur}
        </p>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 bg-(--color-petrol-900) rounded-2xl overflow-hidden aspect-video lg:aspect-auto lg:min-h-[480px]">
          <video ref={videoDistanteRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-contain" />
          {(!enCommunication || !camDistante) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 gap-3">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center"><UserRound size={36} /></div>
              <p className="text-sm">{enCommunication ? `${correspondant} a coupé sa caméra` : LIBELLES_ETAT[etat]}</p>
            </div>
          )}
          <video
            ref={videoLocaleRef}
            autoPlay
            playsInline
            muted
            className={`absolute bottom-20 right-3 w-28 sm:w-40 aspect-video object-cover rounded-xl border-2 border-white/30 bg-black -scale-x-100 ${camOn ? '' : 'opacity-0'}`}
          />
          <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-3 p-3 bg-gradient-to-t from-black/60 to-transparent">
            <button type="button" onClick={basculerMicro} title={micOn ? 'Couper le micro' : 'Activer le micro'}
              className={`p-3 rounded-full ${micOn ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white text-(--color-clay-500)'}`}>
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button type="button" onClick={basculerCamera} title={camOn ? 'Couper la caméra' : 'Activer la caméra'}
              className={`p-3 rounded-full ${camOn ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white text-(--color-clay-500)'}`}>
              {camOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
            </button>
            <button type="button" onClick={() => { setChatOuvert((o) => !o); setNonLus(0); }} title="Messages"
              className="relative p-3 rounded-full bg-white/15 text-white hover:bg-white/25">
              <MessageSquare size={20} />
              {nonLus > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-(--color-amber-400) text-(--color-petrol-900) rounded-full w-5 h-5 flex items-center justify-center">{nonLus}</span>
              )}
            </button>
            {cameraDisponible && (
              <button type="button" onClick={() => appliquerVideoAllegee(!videoAllegee)}
                title={videoAllegee ? 'Revenir à la vidéo normale' : 'Vidéo allégée (réseau faible)'}
                className={`p-3 rounded-full ${videoAllegee ? 'bg-(--color-amber-400) text-(--color-petrol-900)' : 'bg-white/15 text-white hover:bg-white/25'}`}>
                <Gauge size={20} />
              </button>
            )}
            {estMedecin && !cloture && (
              <button type="button" onClick={() => setPanneauCompteRendu((o) => !o)} title="Compte rendu et ordonnance"
                className={`p-3 rounded-full ${panneauCompteRendu ? 'bg-white text-(--color-petrol-700)' : 'bg-white/15 text-white hover:bg-white/25'}`}>
                <Pill size={20} />
              </button>
            )}
            <button type="button" onClick={raccrocher} title="Quitter"
              className="p-3 px-5 rounded-full bg-(--color-clay-500) text-white hover:opacity-90">
              <PhoneOff size={20} />
            </button>
          </div>
        </div>

        {estMedecin && panneauCompteRendu && !cloture && (
          <Card className="lg:w-96 p-5 overflow-y-auto lg:max-h-[640px]">
            <FormulaireCompteRendu onEnregistrer={enregistrerCompteRendu} />
          </Card>
        )}

        {chatOuvert && (
          <Card className="lg:w-80 flex flex-col h-96 lg:h-auto">
            <p className="px-4 py-3 border-b border-(--color-petrol-100) font-semibold text-(--color-ink-900) text-sm">Messages</p>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 && <p className="text-xs text-(--color-ink-300) text-center pt-6">Aucun message.</p>}
              {messages.map((m, i) => (
                <div key={i} className={`max-w-[85%] text-sm rounded-xl px-3 py-2 break-words ${m.moi
                  ? 'ml-auto bg-(--color-petrol-600) text-white' : 'bg-(--color-petrol-50) text-(--color-ink-900)'}`}>
                  {m.texte}
                </div>
              ))}
            </div>
            <form onSubmit={envoyerMessage} className="flex gap-2 p-3 border-t border-(--color-petrol-100)">
              <input value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={2000} placeholder="Écrire..."
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-(--color-petrol-100) text-sm outline-none focus:border-(--color-petrol-400)" />
              <Button type="submit" className="!px-3" disabled={!texte.trim()}><Send size={15} /></Button>
            </form>
          </Card>
        )}
      </div>

      {estMedecin && cloture && <ConfirmationCloture cloture={cloture} />}

      {!estMedecin && ordonnanceRecue && (
        <div className="flex items-center justify-between gap-3 flex-wrap rounded-2xl bg-(--color-sage-100) text-(--color-sage-500) px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Pill size={17} />
            {ordonnanceRecue.ordonnance
              ? 'Le médecin vous a envoyé une ordonnance : présentez son QR code en pharmacie.'
              : 'Le médecin a enregistré le compte rendu de la consultation dans votre carnet.'}
          </p>
          <Link to="/patient/dossier" target="_blank"><Button variant="ghost">Voir dans mon dossier</Button></Link>
        </div>
      )}

      {estMedecin && (
        <p className="text-xs text-(--color-ink-600)">
          Le carnet du patient reste accessible pendant l'appel :{' '}
          <Link to={`/medecin/patients/${infos.patientId}`} target="_blank" className="text-(--color-petrol-600) underline">ouvrir dans un nouvel onglet</Link>.
        </p>
      )}
    </div>
  );
}
