import { useEffect, useMemo, useRef, useState } from 'react';

// Palette validee (scripts/validate_palette.js du skill dataviz : lisibilite daltoniens, contraste).
const COULEURS_SERIES = ['#00789E', '#C8661A'];
const GRILLE = '#E7ECEC';
const TEXTE_AXE = '#6B6B6B';

const MARGE = { haut: 16, droite: 48, bas: 28, gauche: 40 };

function graduations(min, max, n = 4) {
  const brut = (max - min) / n || 1;
  const puissance = 10 ** Math.floor(Math.log10(brut));
  const pas = [1, 2, 2.5, 5, 10].map((m) => m * puissance).find((p) => p >= brut);
  const debut = Math.floor(min / pas) * pas;
  const fin = Math.ceil(max / pas) * pas;
  const ticks = [];
  for (let v = debut; v <= fin + pas / 2; v += pas) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

const formatJour = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
const formatValeur = (v) => v.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

/**
 * Courbe d'evolution d'une mesure. series = [{ nom, valeurs: [{ date, valeur }] }] (1 ou 2 series,
 * ex: systolique / diastolique). zone = { min, max, libelle } : plage habituelle, en fond discret.
 */
export default function GraphiqueMesures({ series, unite, zone, titre }) {
  const [survol, setSurvol] = useState(null);
  const svgRef = useRef(null);
  const figureRef = useRef(null);
  // Le SVG prend sa largeur reelle en pixels : le texte des axes garde sa taille sur telephone.
  const [L, setL] = useState(640);
  const H = L < 480 ? 200 : 240;

  useEffect(() => {
    const el = figureRef.current;
    if (!el) return undefined;
    const obs = new ResizeObserver(([entree]) => setL(Math.max(280, Math.round(entree.contentRect.width))));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const { x, y, ticksY, points, dates } = useMemo(() => {
    const toutes = series.flatMap((s) => s.valeurs);
    const temps = toutes.map((p) => p.date.getTime());
    let tMin = Math.min(...temps);
    let tMax = Math.max(...temps);
    if (tMin === tMax) { tMin -= 864e5; tMax += 864e5; }
    const vals = toutes.map((p) => p.valeur).concat(zone ? [zone.min, zone.max] : []);
    const marge = (Math.max(...vals) - Math.min(...vals)) * 0.1 || 1;
    const ticks = graduations(Math.min(...vals) - marge, Math.max(...vals) + marge);
    const yMin = ticks[0];
    const yMax = ticks[ticks.length - 1];
    const fx = (t) => MARGE.gauche + ((t - tMin) / (tMax - tMin)) * (L - MARGE.gauche - MARGE.droite);
    const fy = (v) => H - MARGE.bas - ((v - yMin) / (yMax - yMin)) * (H - MARGE.haut - MARGE.bas);
    const pts = series.map((s) => s.valeurs.map((p) => ({ ...p, px: fx(p.date.getTime()), py: fy(p.valeur) })));
    const datesUniques = [...new Set(temps)].sort((a, b) => a - b);
    return { x: fx, y: fy, ticksY: ticks, points: pts, dates: datesUniques };
  }, [series, zone, L, H]);

  function bouger(e) {
    const rect = svgRef.current.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * L;
    const t = dates.reduce((a, b) => (Math.abs(x(b) - sx) < Math.abs(x(a) - sx) ? b : a));
    setSurvol(t);
  }

  const nbTicksX = L < 480 ? 3 : 5;
  const ticksX = dates.length <= nbTicksX ? dates
    : [...new Set(Array.from({ length: nbTicksX }, (_, i) => dates[Math.round((i / (nbTicksX - 1)) * (dates.length - 1))]))];
  const valeursSurvol = survol == null ? [] : series.map((s, i) => ({
    nom: s.nom, couleur: COULEURS_SERIES[i], point: points[i].find((p) => p.date.getTime() === survol),
  })).filter((v) => v.point);

  return (
    <figure ref={figureRef} className="relative">
      {/* Legende : series (si plusieurs) et zone habituelle ; jamais d'etiquette posee sur le trace */}
      {(series.length > 1 || zone) && (
        <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--color-ink-600) mb-1">
          {series.length > 1 && series.map((s, i) => (
            <span key={s.nom} className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-0.5 rounded" style={{ background: COULEURS_SERIES[i] }} /> {s.nom}
            </span>
          ))}
          {zone && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm border border-(--color-petrol-100)" style={{ background: '#F2F5F5' }} />
              {zone.libelle} ({formatValeur(zone.min)}–{formatValeur(zone.max)} {unite})
            </span>
          )}
        </figcaption>
      )}
      <svg
        ref={svgRef}
        width={L}
        height={H}
        viewBox={`0 0 ${L} ${H}`}
        className="block max-w-full"
        role="img"
        aria-label={`${titre} : ${series.map((s) => `${s.nom} de ${formatValeur(s.valeurs[0].valeur)} a ${formatValeur(s.valeurs.at(-1).valeur)} ${unite}`).join(', ')}`}
        onMouseMove={bouger}
        onMouseLeave={() => setSurvol(null)}
      >
        {zone && (
          <g>
            <rect x={MARGE.gauche} width={L - MARGE.gauche - MARGE.droite} y={y(zone.max)} height={y(zone.min) - y(zone.max)} fill="#F2F5F5" />
          </g>
        )}
        {ticksY.map((t) => (
          <g key={t}>
            <line x1={MARGE.gauche} x2={L - MARGE.droite} y1={y(t)} y2={y(t)} stroke={GRILLE} strokeWidth="1" />
            <text x={MARGE.gauche - 8} y={y(t) + 3} fontSize="10" textAnchor="end" fill={TEXTE_AXE}>{formatValeur(t)}</text>
          </g>
        ))}
        {ticksX.map((t) => (
          <text key={t} x={x(t)} y={H - 8} fontSize="10" textAnchor="middle" fill={TEXTE_AXE}>{formatJour(new Date(t))}</text>
        ))}

        {survol != null && (
          <line x1={x(survol)} x2={x(survol)} y1={MARGE.haut} y2={H - MARGE.bas} stroke={TEXTE_AXE} strokeWidth="1" />
        )}

        {points.map((pts, i) => (
          <g key={series[i].nom}>
            {pts.length > 1 && (
              <polyline
                points={pts.map((p) => `${p.px},${p.py}`).join(' ')}
                fill="none" stroke={COULEURS_SERIES[i]} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
              />
            )}
            {pts.map((p) => (
              <circle key={p.date.getTime()} cx={p.px} cy={p.py} r={p.date.getTime() === survol ? 5.5 : 4}
                fill={COULEURS_SERIES[i]} stroke="#FFFFFF" strokeWidth="2" />
            ))}
            {/* Etiquette directe a la fin de la courbe (valeur la plus recente) */}
            <text x={pts.at(-1).px + 10} y={pts.at(-1).py + 4} fontSize="11" fontWeight="600" fill="#1A1A1A">
              {formatValeur(pts.at(-1).valeur)}
            </text>
          </g>
        ))}

        {/* Zone de survol plus large que les marques */}
        <rect x={MARGE.gauche} y={0} width={L - MARGE.gauche - MARGE.droite} height={H} fill="transparent" />
      </svg>

      {survol != null && valeursSurvol.length > 0 && (
        <div
          className="pointer-events-none absolute top-6 bg-white border border-(--color-petrol-100) rounded-lg shadow-sm px-3 py-2 text-xs"
          style={{ left: `${Math.min(75, (x(survol) / L) * 100)}%` }}
        >
          <p className="font-semibold text-(--color-ink-900)">
            {new Date(survol).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
          {valeursSurvol.map((v) => (
            <p key={v.nom} className="flex items-center gap-1.5 text-(--color-ink-600)">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: v.couleur }} />
              {v.nom} : <strong className="text-(--color-ink-900)">{formatValeur(v.point.valeur)} {unite}</strong>
            </p>
          ))}
        </div>
      )}
    </figure>
  );
}
