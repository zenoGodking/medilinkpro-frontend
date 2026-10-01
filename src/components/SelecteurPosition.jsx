import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, X } from 'lucide-react';
import { TUILES_URL, TUILES_ATTRIBUTION } from '../utils/itineraire';

const CENTRE_PAR_DEFAUT = [3.848, 11.502]; // Yaounde

const marqueur = L.divIcon({
  className: '',
  html: '<div style="background:#0F4C5C;border:3px solid #fff;border-radius:9999px;width:24px;height:24px;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

/**
 * Choix de la position GPS d'un etablissement : clic sur la carte (le point peut etre deplace)
 * ou position actuelle de l'appareil (pratique si l'on est sur place).
 */
export default function SelecteurPosition({ latitude, longitude, onChange }) {
  const conteneurRef = useRef(null);
  const carteRef = useRef(null);
  const pointRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [erreur, setErreur] = useState(null);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    const depart = latitude != null ? [latitude, longitude] : CENTRE_PAR_DEFAUT;
    const carte = L.map(conteneurRef.current).setView(depart, latitude != null ? 16 : 12);
    L.tileLayer(TUILES_URL, { maxZoom: 19, attribution: TUILES_ATTRIBUTION }).addTo(carte);
    carte.on('click', (e) => onChangeRef.current({ latitude: e.latlng.lat, longitude: e.latlng.lng }));
    carteRef.current = carte;
    return () => {
      carte.remove();
      carteRef.current = null;
      pointRef.current = null;
    };
    // Carte creee une fois ; le point suit ensuite les props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const carte = carteRef.current;
    if (!carte) return;
    if (latitude == null) {
      pointRef.current?.remove();
      pointRef.current = null;
      return;
    }
    const pos = [latitude, longitude];
    if (pointRef.current) {
      pointRef.current.setLatLng(pos);
    } else {
      pointRef.current = L.marker(pos, { icon: marqueur, draggable: true }).addTo(carte);
      pointRef.current.on('dragend', (e) => {
        const p = e.target.getLatLng();
        onChangeRef.current({ latitude: p.lat, longitude: p.lng });
      });
    }
  }, [latitude, longitude]);

  function maPosition() {
    setErreur(null);
    if (!('geolocation' in navigator)) {
      setErreur('Géolocalisation indisponible sur cet appareil.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onChange({ latitude: coords.latitude, longitude: coords.longitude });
        carteRef.current?.setView([coords.latitude, coords.longitude], 17);
      },
      () => setErreur('Position introuvable : autorisez la localisation ou cliquez sur la carte.'),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <div className="space-y-2">
      <div ref={conteneurRef} className="w-full h-56 rounded-xl overflow-hidden border border-(--color-petrol-100) z-0" />
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-(--color-ink-600)">
        <span>
          {latitude != null
            ? `Position : ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (déplacez le point pour ajuster)`
            : "Cliquez sur la carte à l'emplacement de l'entrée de l'établissement."}
        </span>
        <span className="flex gap-2">
          <button type="button" onClick={maPosition} className="flex items-center gap-1 font-medium text-(--color-petrol-600) hover:underline">
            <LocateFixed size={13} /> Ma position actuelle
          </button>
          {latitude != null && (
            <button type="button" onClick={() => onChange({ latitude: null, longitude: null })} className="flex items-center gap-1 text-(--color-clay-500) hover:underline">
              <X size={13} /> Retirer
            </button>
          )}
        </span>
      </div>
      {erreur && <p className="text-xs text-(--color-clay-500)">{erreur}</p>}
    </div>
  );
}
