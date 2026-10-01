import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Clock } from 'lucide-react';
import {
  TUILES_URL, TUILES_ATTRIBUTION, calculerItineraire, distance, formatDistance, formatDuree,
  indexPlusProche, longueurTrace,
} from '../utils/itineraire';

// Le trajet de l'infirmiere est recalcule quand elle s'en ecarte de plus de 150 m.
const SEUIL_RECALCUL_M = 150;

function pastille(couleur, libelle) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${couleur};color:#fff;border:3px solid #fff;border-radius:9999px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,.35)">${libelle}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

/**
 * Carte integree (Leaflet) montrant le patient et l'infirmiere en route, avec son trajet routier
 * et l'heure d'arrivee estimee. Le marqueur de l'infirmiere se deplace a chaque nouvelle position ;
 * le cadrage n'est ajuste automatiquement qu'a la premiere position, pour ne pas gener l'utilisateur.
 */
export default function CarteSuivi({ patient, infirmiere }) {
  const conteneurRef = useRef(null);
  const carteRef = useRef(null);
  const marqueurInfRef = useRef(null);
  const cadreRef = useRef(false);
  const traceRef = useRef(null);
  const departTraceRef = useRef(null);
  const [itineraire, setItineraire] = useState(null);

  useEffect(() => {
    const carte = L.map(conteneurRef.current, { zoomControl: true }).setView(
      patient ? [patient.latitude, patient.longitude] : [3.848, 11.502],
      14,
    );
    L.tileLayer(TUILES_URL, { maxZoom: 19, attribution: TUILES_ATTRIBUTION }).addTo(carte);
    if (patient) {
      L.marker([patient.latitude, patient.longitude], { icon: pastille('#2f6f73', 'Moi') }).addTo(carte);
    }
    carteRef.current = carte;
    return () => {
      carte.remove();
      carteRef.current = null;
      marqueurInfRef.current = null;
      traceRef.current = null;
      cadreRef.current = false;
    };
    // La position du patient est fixe pendant l'intervention.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const carte = carteRef.current;
    if (!carte || !infirmiere?.latitude) return;
    const pos = [infirmiere.latitude, infirmiere.longitude];
    if (marqueurInfRef.current) {
      marqueurInfRef.current.setLatLng(pos);
    } else {
      marqueurInfRef.current = L.marker(pos, { icon: pastille('#d9822b', 'Inf') }).addTo(carte);
    }
    if (!cadreRef.current) {
      cadreRef.current = true;
      if (patient) {
        carte.fitBounds(L.latLngBounds([pos, [patient.latitude, patient.longitude]]), { padding: [40, 40], maxZoom: 16 });
      } else {
        carte.setView(pos, 15);
      }
    }
  }, [infirmiere, patient]);

  // Trajet routier infirmiere -> patient, recalcule si elle s'en ecarte
  useEffect(() => {
    if (!patient || !infirmiere?.latitude) return undefined;
    const pos = [infirmiere.latitude, infirmiere.longitude];
    const depart = departTraceRef.current;
    if (depart && distance(depart, pos) < SEUIL_RECALCUL_M) return undefined;
    departTraceRef.current = pos;
    const controleur = new AbortController();
    calculerItineraire(pos, [patient.latitude, patient.longitude], { signal: controleur.signal })
      .then(setItineraire)
      .catch(() => {});
    return () => controleur.abort();
  }, [infirmiere, patient]);

  useEffect(() => {
    const carte = carteRef.current;
    if (!carte || !itineraire) return;
    if (traceRef.current) traceRef.current.remove();
    traceRef.current = L.polyline(itineraire.points, { color: '#0F4C5C', weight: 5, opacity: 0.75 }).addTo(carte);
  }, [itineraire]);

  let estimation = null;
  if (itineraire && infirmiere?.latitude) {
    const i = indexPlusProche(itineraire.points, [infirmiere.latitude, infirmiere.longitude]);
    const restant = longueurTrace(itineraire.points, i, itineraire.points.length - 1);
    const vitesse = itineraire.duree > 0 ? itineraire.distance / itineraire.duree : 8;
    estimation = { restant, duree: restant / vitesse };
  }

  return (
    <div className="space-y-2">
      <div ref={conteneurRef} className="w-full h-72 rounded-xl overflow-hidden border border-(--color-petrol-100) z-0" />
      {estimation && (
        <p className="flex items-center gap-1.5 text-sm text-(--color-ink-600)">
          <Clock size={14} className="text-(--color-petrol-400)" />
          Arrivée estimée dans <span className="font-semibold text-(--color-ink-900)">{formatDuree(estimation.duree)}</span>
          ({formatDistance(estimation.restant)} par la route)
        </p>
      )}
    </div>
  );
}
