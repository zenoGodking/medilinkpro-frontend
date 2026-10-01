import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Navigation, Building2, MapPin, Phone } from 'lucide-react';
import { TUILES_URL, TUILES_ATTRIBUTION, distance, formatDistance } from '../utils/itineraire';
import NavigationInterne from './NavigationInterne';

const CENTRE_PAR_DEFAUT = [3.848, 11.502];

function pastille(actif) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${actif ? '#E68A3A' : '#0F4C5C'};color:#fff;border:3px solid #fff;border-radius:9999px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.35)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

const moi = L.divIcon({
  className: '',
  html: '<div style="background:#2E8B6F;border:3px solid #fff;border-radius:9999px;width:18px;height:18px;box-shadow:0 0 0 6px rgba(46,139,111,.25)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/**
 * Carte des etablissements de sante, entierement dans l'application : marqueurs, "pres de moi"
 * (tri par distance) et itineraire guide jusqu'a l'etablissement choisi.
 * `lienDetail(e)` donne la page de detail d'un etablissement.
 */
export default function CarteEtablissements({ etablissements, lienDetail }) {
  const conteneurRef = useRef(null);
  const carteRef = useRef(null);
  const marqueursRef = useRef(new Map());
  const moiRef = useRef(null);
  const [position, setPosition] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [selection, setSelection] = useState(null);
  const [navigation, setNavigation] = useState(null);

  const localises = useMemo(() => etablissements.filter((e) => e.latitude != null && e.longitude != null), [etablissements]);
  const tries = useMemo(() => {
    const avecDistance = localises.map((e) => ({ ...e, distance: position ? distance(position, [e.latitude, e.longitude]) : null }));
    return position ? avecDistance.sort((a, b) => a.distance - b.distance) : avecDistance;
  }, [localises, position]);

  useEffect(() => {
    const carte = L.map(conteneurRef.current).setView(CENTRE_PAR_DEFAUT, 12);
    L.tileLayer(TUILES_URL, { maxZoom: 19, attribution: TUILES_ATTRIBUTION }).addTo(carte);
    carteRef.current = carte;
    const marqueurs = marqueursRef.current;
    return () => {
      carte.remove();
      carteRef.current = null;
      marqueurs.clear();
      moiRef.current = null;
    };
  }, []);

  useEffect(() => {
    const carte = carteRef.current;
    if (!carte) return;
    marqueursRef.current.forEach((m) => m.remove());
    marqueursRef.current.clear();
    localises.forEach((e) => {
      const m = L.marker([e.latitude, e.longitude], { icon: pastille(false), title: e.nom }).addTo(carte);
      m.on('click', () => setSelection(e.id));
      marqueursRef.current.set(e.id, m);
    });
    if (localises.length > 0) {
      carte.fitBounds(L.latLngBounds(localises.map((e) => [e.latitude, e.longitude])), { padding: [40, 40], maxZoom: 15 });
    }
  }, [localises]);

  useEffect(() => {
    marqueursRef.current.forEach((m, id) => m.setIcon(pastille(id === selection)));
    const e = localises.find((x) => x.id === selection);
    if (e) carteRef.current?.panTo([e.latitude, e.longitude]);
  }, [selection, localises]);

  function presDeMoi() {
    setErreur(null);
    if (!('geolocation' in navigator)) {
      setErreur('Géolocalisation indisponible sur cet appareil.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const p = [coords.latitude, coords.longitude];
        setPosition(p);
        const carte = carteRef.current;
        if (!carte) return;
        if (moiRef.current) moiRef.current.setLatLng(p);
        else moiRef.current = L.marker(p, { icon: moi, zIndexOffset: 1000 }).addTo(carte);
        carte.setView(p, 14);
      },
      () => setErreur('Position introuvable : autorisez la localisation.'),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div ref={conteneurRef} className="w-full h-[55vh] min-h-80 rounded-2xl overflow-hidden border border-(--color-petrol-100) z-0" />
        <button type="button" onClick={presDeMoi}
          className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-white rounded-full shadow-md px-3.5 py-2 text-sm font-semibold text-(--color-petrol-600)">
          <LocateFixed size={16} /> Près de moi
        </button>
      </div>
      {erreur && <p className="text-sm text-(--color-clay-500)">{erreur}</p>}
      {localises.length < etablissements.length && (
        <p className="text-xs text-(--color-ink-600)">
          {etablissements.length - localises.length} établissement(s) n'ont pas encore indiqué leur position.
        </p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tries.map((e) => (
          <div key={e.id}
            className={`bg-white rounded-2xl border p-4 transition-colors ${selection === e.id ? 'border-(--color-amber-400) shadow-md' : 'border-(--color-petrol-100)'}`}
            onMouseEnter={() => setSelection(e.id)}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-display font-semibold text-(--color-ink-900) leading-tight">{e.nom}</p>
                {e.type && <p className="text-xs text-(--color-amber-500) font-medium">{e.type}</p>}
              </div>
              {e.distance != null && <span className="text-xs font-semibold text-(--color-petrol-600) shrink-0">{formatDistance(e.distance)}</span>}
            </div>
            {(e.adresse || e.ville) && (
              <p className="flex items-start gap-1.5 text-xs text-(--color-ink-600) mt-2">
                <MapPin size={12} className="mt-0.5 shrink-0" /> {[e.adresse, e.quartier, e.ville].filter(Boolean).join(', ')}
              </p>
            )}
            {e.telephone && <p className="flex items-center gap-1.5 text-xs text-(--color-ink-600) mt-1"><Phone size={12} /> {e.telephone}</p>}
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={() => setNavigation(e)}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full bg-(--color-petrol-600) text-white hover:bg-(--color-petrol-700)">
                <Navigation size={14} /> Itinéraire
              </button>
              {lienDetail && (
                <Link to={lienDetail(e)} className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-(--color-petrol-50) text-(--color-petrol-600)">
                  <Building2 size={14} /> Fiche
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {navigation && (
        <NavigationInterne
          destination={{ latitude: navigation.latitude, longitude: navigation.longitude }}
          libelle={[navigation.nom, navigation.adresse].filter(Boolean).join(' · ')}
          libelleArrivee={navigation.nom}
          telephone={navigation.telephone}
          onFermer={() => setNavigation(null)}
        />
      )}
    </div>
  );
}
