import { useEffect, useRef, useState } from 'react';

/** Distance approximative en metres entre deux positions (suffisant pour filtrer les petits mouvements). */
function distanceMetres(a, b) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Suit la position GPS de l'appareil (watchPosition) et appelle onPosition au plus toutes les
 * `intervalleMs`, ou plus tot si l'appareil a bouge de plus de `deplacementMinM` metres.
 * Un rappel periodique est aussi envoye a l'arret, pour que le backend sache que l'app est ouverte.
 * Retourne { position, erreur }.
 */
export function usePositionGps(actif, onPosition, { intervalleMs = 5000, deplacementMinM = 15, rappelMs = 60000 } = {}) {
  const [position, setPosition] = useState(null);
  const [erreur, setErreur] = useState(null);
  const onPositionRef = useRef(onPosition);
  useEffect(() => {
    onPositionRef.current = onPosition;
  }, [onPosition]);
  const disponible = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  useEffect(() => {
    if (!actif || !disponible) return undefined;

    let dernierEnvoi = null;
    let derniereDate = 0;
    let derniere = null;

    function envoyer(p) {
      dernierEnvoi = p;
      derniereDate = Date.now();
      onPositionRef.current?.(p);
    }

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const p = { latitude: coords.latitude, longitude: coords.longitude };
        derniere = p;
        setPosition(p);
        setErreur(null);
        const assezLoin = !dernierEnvoi || distanceMetres(dernierEnvoi, p) >= deplacementMinM;
        if (assezLoin && Date.now() - derniereDate >= intervalleMs) envoyer(p);
      },
      (err) => setErreur(err.code === err.PERMISSION_DENIED
        ? 'Autorisez la localisation pour recevoir les alertes proches de vous.'
        : 'Position GPS indisponible pour le moment.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );

    const rappel = setInterval(() => {
      if (derniere && Date.now() - derniereDate >= rappelMs) envoyer(derniere);
    }, rappelMs);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(rappel);
    };
  }, [actif, disponible, intervalleMs, deplacementMinM, rappelMs]);

  return {
    position,
    erreur: disponible ? erreur : "La geolocalisation n'est pas disponible sur cet appareil.",
  };
}

/** Position ponctuelle (ex: au moment ou le patient envoie son alerte). */
export function lirePositionActuelle() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('indisponible'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  });
}
