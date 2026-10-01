import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  X, LocateFixed, Volume2, VolumeX, ArrowUp, ArrowUpLeft, ArrowUpRight, CornerUpLeft, CornerUpRight,
  RotateCw, Undo2, Flag, AlertTriangle, Phone,
} from 'lucide-react';
import {
  TUILES_URL, TUILES_ATTRIBUTION, calculerItineraire, distance, cap, direction, formatDistance, formatDuree,
  indexPlusProche, ecartAuTrace, longueurTrace,
} from '../utils/itineraire';

const SEUIL_ARRIVEE_M = 40;
const SEUIL_RECALCUL_M = 60;
const DELAI_MIN_RECALCUL_MS = 10000;
const DISTANCE_ANNONCE_M = 150;

function IconeManoeuvre({ etape, size = 30 }) {
  if (!etape) return <ArrowUp size={size} />;
  if (etape.type === 'arrive') return <Flag size={size} />;
  if (etape.type === 'roundabout' || etape.type === 'rotary') return <RotateCw size={size} />;
  const m = etape.modifier || '';
  if (m === 'uturn') return <Undo2 size={size} />;
  if (m === 'sharp left' || m === 'left') return <CornerUpLeft size={size} />;
  if (m === 'sharp right' || m === 'right') return <CornerUpRight size={size} />;
  if (m === 'slight left') return <ArrowUpLeft size={size} />;
  if (m === 'slight right') return <ArrowUpRight size={size} />;
  return <ArrowUp size={size} />;
}

function marqueurPosition(capDegres) {
  return L.divIcon({
    className: '',
    html: `<div style="width:30px;height:30px;transform:rotate(${capDegres ?? 0}deg)">
      <svg viewBox="0 0 30 30" width="30" height="30"><circle cx="15" cy="15" r="13" fill="#0F4C5C" stroke="#fff" stroke-width="3"/>
      ${capDegres == null ? '' : '<path d="M15 6 L21 19 L15 16 L9 19 Z" fill="#fff"/>'}</svg></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

const marqueurDestination = L.divIcon({
  className: '',
  html: '<div style="background:#E68A3A;color:#fff;border:3px solid #fff;border-radius:9999px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,.35)">P</div>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

function annoncer(texte) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texte);
    u.lang = 'fr-FR';
    window.speechSynthesis.speak(u);
  } catch {
    // Synthese vocale indisponible : guidage visuel uniquement.
  }
}

/**
 * Guidage GPS integre vers le domicile du patient, en plein ecran : carte, trace routier,
 * consigne de la prochaine manoeuvre, distance et temps restants, annonces vocales en francais.
 * Le trace est recalcule automatiquement en cas d'ecart. Sans service de routage joignable,
 * on affiche la direction et la distance a vol d'oiseau.
 */
export default function NavigationInterne({ destination, libelle, telephone, onFermer, libelleArrivee = 'chez le patient' }) {
  const cible = useMemo(() => [destination.latitude, destination.longitude], [destination.latitude, destination.longitude]);
  const conteneurRef = useRef(null);
  const carteRef = useRef(null);
  const marqueurRef = useRef(null);
  const traceRef = useRef(null);
  const suivreRef = useRef(true);
  const dernierCalculRef = useRef(0);
  const calculEnCoursRef = useRef(false);
  const annonceesRef = useRef(new Set());

  const [position, setPosition] = useState(null);
  // Instant de la derniere position GPS (sert a afficher l'heure d'arrivee sans lire l'horloge au rendu).
  const [horodatage, setHorodatage] = useState(null);
  const [capActuel, setCapActuel] = useState(null);
  const [itineraire, setItineraire] = useState(null);
  const [routageIndisponible, setRoutageIndisponible] = useState(false);
  const [erreurGps, setErreurGps] = useState(null);
  const [suivre, setSuivre] = useState(true);
  const [voix, setVoix] = useState(true);

  // Carte
  useEffect(() => {
    const carte = L.map(conteneurRef.current, { zoomControl: false }).setView(cible, 16);
    L.tileLayer(TUILES_URL, { maxZoom: 19, attribution: TUILES_ATTRIBUTION }).addTo(carte);
    L.control.zoom({ position: 'bottomright' }).addTo(carte);
    L.marker(cible, { icon: marqueurDestination }).addTo(carte);
    carte.on('dragstart', () => { suivreRef.current = false; setSuivre(false); });
    carteRef.current = carte;
    return () => {
      carte.remove();
      carteRef.current = null;
      marqueurRef.current = null;
      traceRef.current = null;
    };
  }, [cible]);

  // Position GPS en continu (haute precision, propre a la navigation)
  const gpsDisponible = typeof navigator !== 'undefined' && 'geolocation' in navigator;
  useEffect(() => {
    if (!gpsDisponible) return undefined;
    let precedente = null;
    const id = navigator.geolocation.watchPosition(
      ({ coords, timestamp }) => {
        const p = [coords.latitude, coords.longitude];
        setErreurGps(null);
        setPosition(p);
        setHorodatage(timestamp);
        if (coords.heading != null && !Number.isNaN(coords.heading) && coords.speed > 0.5) {
          setCapActuel(coords.heading);
        } else if (precedente && distance(precedente, p) > 8) {
          setCapActuel(cap(precedente, p));
        }
        if (!precedente || distance(precedente, p) > 8) precedente = p;
      },
      (err) => setErreurGps(err.code === err.PERMISSION_DENIED
        ? 'Autorisez la localisation pour être guide(e) jusqu\'au patient.'
        : 'Recherche du signal GPS...'),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [gpsDisponible]);
  const messageGps = gpsDisponible ? erreurGps : "La géolocalisation n'est pas disponible sur cet appareil.";

  const recalculer = useCallback(async (depart) => {
    if (calculEnCoursRef.current) return;
    calculEnCoursRef.current = true;
    dernierCalculRef.current = Date.now();
    try {
      const r = await calculerItineraire(depart, cible);
      setItineraire(r);
      setRoutageIndisponible(false);
      annonceesRef.current = new Set();
    } catch {
      setRoutageIndisponible(true);
    } finally {
      calculEnCoursRef.current = false;
    }
  }, [cible]);

  // Calcul initial puis recalcul en cas d'ecart au trace
  useEffect(() => {
    if (!position) return;
    const depuis = Date.now() - dernierCalculRef.current;
    const horsTrace = itineraire && ecartAuTrace(itineraire.points, position) > SEUIL_RECALCUL_M;
    const reessayer = routageIndisponible && depuis > 30000;
    if ((!itineraire && !routageIndisponible) || ((horsTrace || reessayer) && depuis > DELAI_MIN_RECALCUL_MS)) {
      recalculer(position);
    }
  }, [position, itineraire, routageIndisponible, recalculer]);

  // Rendu du trace et de la position
  useEffect(() => {
    const carte = carteRef.current;
    if (!carte) return;
    if (traceRef.current) traceRef.current.remove();
    if (itineraire) {
      traceRef.current = L.polyline(itineraire.points, { color: '#0F4C5C', weight: 7, opacity: 0.85 }).addTo(carte);
    } else if (position) {
      traceRef.current = L.polyline([position, cible], { color: '#E68A3A', weight: 4, dashArray: '8 10' }).addTo(carte);
    }
  }, [itineraire, position, cible]);

  useEffect(() => {
    const carte = carteRef.current;
    if (!carte || !position) return;
    if (marqueurRef.current) {
      marqueurRef.current.setLatLng(position);
      marqueurRef.current.setIcon(marqueurPosition(capActuel));
    } else {
      marqueurRef.current = L.marker(position, { icon: marqueurPosition(capActuel), zIndexOffset: 1000 }).addTo(carte);
      carte.fitBounds(L.latLngBounds([position, cible]), { padding: [60, 60], maxZoom: 17 });
      return;
    }
    if (suivreRef.current) carte.panTo(position, { animate: true });
  }, [position, capActuel, cible]);

  // Progression le long du trace
  const progression = useMemo(() => {
    if (!position) return null;
    const restantVolOiseau = distance(position, cible);
    if (!itineraire) return { restant: restantVolOiseau, arrive: restantVolOiseau < SEUIL_ARRIVEE_M };
    const i = indexPlusProche(itineraire.points, position);
    const restant = longueurTrace(itineraire.points, i, itineraire.points.length - 1);
    const vitesse = itineraire.distance > 0 ? itineraire.distance / itineraire.duree : 8;
    const prochaine = itineraire.etapes.find((e) => e.index > i && e.type !== 'depart') || itineraire.etapes[itineraire.etapes.length - 1];
    const suivante = prochaine ? itineraire.etapes[itineraire.etapes.indexOf(prochaine) + 1] : null;
    return {
      restant,
      duree: restant / vitesse,
      prochaine,
      suivante,
      avantManoeuvre: prochaine ? longueurTrace(itineraire.points, i, prochaine.index) : null,
      arrive: restantVolOiseau < SEUIL_ARRIVEE_M,
    };
  }, [position, itineraire, cible]);

  // Annonces vocales : a l'approche de chaque manoeuvre, et a l'arrivee
  useEffect(() => {
    if (!voix || !progression) return;
    const { prochaine, avantManoeuvre, arrive } = progression;
    if (arrive && !annonceesRef.current.has('arrivee')) {
      annonceesRef.current.add('arrivee');
      annoncer(`Vous êtes arrivé ${libelleArrivee.startsWith('chez') ? libelleArrivee : `à ${libelleArrivee}`}.`);
      return;
    }
    if (prochaine && avantManoeuvre != null && avantManoeuvre < DISTANCE_ANNONCE_M) {
      const cle = `${prochaine.index}-${prochaine.type}`;
      if (!annonceesRef.current.has(cle)) {
        annonceesRef.current.add(cle);
        annoncer(`Dans ${formatDistance(avantManoeuvre)}, ${prochaine.consigne.charAt(0).toLowerCase()}${prochaine.consigne.slice(1)}`);
      }
    }
  }, [progression, voix, libelleArrivee]);

  function recentrer() {
    suivreRef.current = true;
    setSuivre(true);
    if (position) carteRef.current?.setView(position, 17);
  }

  const arrive = progression?.arrive;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-(--color-petrol-900)" role="dialog" aria-modal="true">
      {/* Bandeau de consigne */}
      <div className="bg-(--color-petrol-700) text-white px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
          {arrive ? <Flag size={30} /> : <IconeManoeuvre etape={progression?.prochaine} />}
        </div>
        <div className="flex-1 min-w-0">
          {arrive ? (
            <p className="font-display font-semibold text-lg">Vous êtes arrivé(e) {libelleArrivee.startsWith('chez') ? libelleArrivee : `à ${libelleArrivee}`}</p>
          ) : progression?.prochaine ? (
            <>
              <p className="text-2xl font-bold leading-none">{formatDistance(progression.avantManoeuvre)}</p>
              <p className="text-sm text-white/90 mt-1 truncate">{progression.prochaine.consigne}</p>
              {progression.suivante && progression.avantManoeuvre < 300 && (
                <p className="text-xs text-white/60 truncate">Puis : {progression.suivante.consigne}</p>
              )}
            </>
          ) : position && routageIndisponible ? (
            <>
              <p className="text-2xl font-bold leading-none">{formatDistance(progression?.restant)}</p>
              <p className="text-sm text-white/90 mt-1">Direction {direction(cap(position, cible))} (à vol d'oiseau)</p>
            </>
          ) : (
            <p className="text-sm text-white/80">{messageGps || 'Calcul de l\'itinéraire...'}</p>
          )}
        </div>
        <button type="button" onClick={onFermer} className="p-2 rounded-full hover:bg-white/10 self-start" aria-label="Fermer la navigation">
          <X size={22} />
        </button>
      </div>

      {routageIndisponible && (
        <p className="flex items-center gap-2 text-xs bg-(--color-amber-400) text-(--color-petrol-900) px-4 py-1.5">
          <AlertTriangle size={13} /> Calcul d'itinéraire indisponible : guidage en ligne droite, nouvel essai automatique.
        </p>
      )}

      <div className="relative flex-1 min-h-0">
        <div ref={conteneurRef} className="absolute inset-0" />
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
          <button type="button" onClick={() => setVoix((v) => !v)} title={voix ? 'Couper la voix' : 'Activer la voix'}
            className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center text-(--color-petrol-600)">
            {voix ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          {!suivre && (
            <button type="button" onClick={recentrer} title="Recentrer"
              className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center text-(--color-petrol-600)">
              <LocateFixed size={19} />
            </button>
          )}
        </div>
      </div>

      {/* Resume du trajet */}
      <div className="bg-white px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] flex items-center justify-between gap-3">
        <div className="min-w-0">
          {progression && !arrive ? (
            <p className="font-display font-semibold text-(--color-ink-900)">
              {progression.duree != null ? `${formatDuree(progression.duree)} · ` : ''}{formatDistance(progression.restant)}
              {progression.duree != null && horodatage != null && (
                <span className="text-sm font-normal text-(--color-ink-600)">
                  {' '}· arrivée vers {new Date(horodatage + progression.duree * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          ) : null}
          <p className="text-sm text-(--color-ink-600) truncate">{libelle}</p>
        </div>
        {telephone && (
          <a href={`tel:${telephone}`} className="shrink-0 w-11 h-11 rounded-full bg-(--color-sage-100) text-(--color-sage-500) flex items-center justify-center" aria-label="Appeler">
            <Phone size={19} />
          </a>
        )}
      </div>
    </div>
  );
}
