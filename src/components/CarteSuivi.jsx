import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function pastille(couleur, libelle) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${couleur};color:#fff;border:3px solid #fff;border-radius:9999px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,.35)">${libelle}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

/**
 * Carte OpenStreetMap (Leaflet) montrant le patient et l'infirmiere en route.
 * Le marqueur de l'infirmiere se deplace a chaque nouvelle position ; le cadrage
 * n'est ajuste automatiquement qu'a la premiere position, pour ne pas gener l'utilisateur.
 */
export default function CarteSuivi({ patient, infirmiere }) {
  const conteneurRef = useRef(null);
  const carteRef = useRef(null);
  const marqueurInfRef = useRef(null);
  const cadreRef = useRef(false);

  useEffect(() => {
    const carte = L.map(conteneurRef.current, { zoomControl: true }).setView(
      patient ? [patient.latitude, patient.longitude] : [3.848, 11.502],
      14,
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(carte);
    if (patient) {
      L.marker([patient.latitude, patient.longitude], { icon: pastille('#2f6f73', 'Moi') }).addTo(carte);
    }
    carteRef.current = carte;
    return () => {
      carte.remove();
      carteRef.current = null;
      marqueurInfRef.current = null;
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

  return <div ref={conteneurRef} className="w-full h-72 rounded-xl overflow-hidden border border-(--color-petrol-100) z-0" />;
}
