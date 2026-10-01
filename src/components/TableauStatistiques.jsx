import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Table2, BarChart3 } from 'lucide-react';
import { Card } from './ui';

// Teinte unique des barres : variante saturee du bleu petrole de la marque, validee
// (bande de luminance, saturation minimale, contraste >= 3:1 sur la surface claire).
const COULEUR_SERIE = '#007F9E';

const LIBELLES_STATUT = {
  CONFIRME: 'Confirmés (non clôturés)',
  TERMINE: 'Effectués',
  NO_SHOW: 'Absences',
  ANNULE: 'Annulés',
  REFUSE: 'Refusés',
  EN_ATTENTE: 'Sans réponse',
};

function nombre(v) {
  return v == null ? '—' : v.toLocaleString('fr-FR');
}

function pourcent(v) {
  return v == null ? '—' : `${v.toLocaleString('fr-FR')} %`;
}

/** Tuile d'indicateur : libelle, valeur, precision facultative. */
function Tuile({ libelle, valeur, precision, lien }) {
  const contenu = (
    <Card className="p-4 h-full">
      <p className="text-sm text-(--color-ink-600)">{libelle}</p>
      <p className="font-sans font-semibold text-2xl text-(--color-ink-900) mt-1 tabular-nums">{valeur}</p>
      {precision && <p className="text-xs text-(--color-ink-300) mt-1">{precision}</p>}
    </Card>
  );
  return lien ? <Link to={lien} className="block hover:-translate-y-0.5 transition-transform">{contenu}</Link> : contenu;
}

function pasGraduation(max) {
  if (max <= 5) return 1;
  const brut = max / 4;
  const puissance = 10 ** Math.floor(Math.log10(brut));
  return [1, 2, 5, 10].map((m) => m * puissance).find((p) => p >= brut);
}

/** Histogramme des rendez-vous par jour (une serie), infobulle au survol, vue tableau alternative. */
function HistogrammeJours({ points }) {
  const [survol, setSurvol] = useState(null);
  const [vueTableau, setVueTableau] = useState(false);
  const max = Math.max(1, ...points.map((p) => p.total));
  const pas = pasGraduation(max);
  const plafond = Math.ceil(max / pas) * pas;
  const graduations = [];
  for (let v = 0; v <= plafond; v += pas) graduations.push(v);
  const indexMax = points.reduce((im, p, i) => (p.total > points[im].total ? i : im), 0);
  const H = 160;

  const formatJour = (d) => new Date(`${d}T00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-display font-semibold text-(--color-ink-900)">Rendez-vous par jour</p>
          <p className="text-xs text-(--color-ink-600)">30 derniers jours, tous statuts</p>
        </div>
        <button type="button" onClick={() => setVueTableau((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-(--color-petrol-600) hover:underline">
          {vueTableau ? <><BarChart3 size={14} /> Graphique</> : <><Table2 size={14} /> Tableau</>}
        </button>
      </div>

      {vueTableau ? (
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-(--color-ink-600)"><th className="py-1 font-medium">Jour</th><th className="py-1 font-medium text-right">Rendez-vous</th></tr></thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.date} className="border-t border-(--color-petrol-50)">
                  <td className="py-1 text-(--color-ink-900)">{formatJour(p.date)}</td>
                  <td className="py-1 text-right tabular-nums text-(--color-ink-900)">{p.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="relative w-6 shrink-0 text-[11px] text-(--color-ink-300) tabular-nums" style={{ height: H }}>
            {graduations.map((g) => (
              <span key={g} className="absolute right-0 -translate-y-1/2" style={{ top: H - (g / plafond) * H }}>{g}</span>
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <div className="relative" style={{ height: H }} onMouseLeave={() => setSurvol(null)}>
              {graduations.map((g) => (
                <div key={g} className="absolute inset-x-0 border-t border-(--color-petrol-50)" style={{ top: H - (g / plafond) * H }} />
              ))}
              <div className="absolute inset-0 flex items-end" style={{ gap: 2 }}>
                {points.map((p, i) => {
                  const hauteur = (p.total / plafond) * H;
                  return (
                    <div key={p.date} className="relative flex-1 h-full flex items-end justify-center cursor-default"
                      onMouseEnter={() => setSurvol(i)} onFocus={() => setSurvol(i)} tabIndex={0}
                      aria-label={`${formatJour(p.date)} : ${p.total} rendez-vous`}>
                      {p.total > 0 && (
                        <div className="w-full max-w-6" style={{
                          height: Math.max(hauteur, 2), background: COULEUR_SERIE,
                          borderRadius: '4px 4px 0 0', opacity: survol == null || survol === i ? 1 : 0.55,
                        }} />
                      )}
                      {i === indexMax && p.total > 0 && survol == null && (
                        <span className="absolute text-[11px] font-semibold text-(--color-ink-900) tabular-nums" style={{ bottom: hauteur + 4 }}>{p.total}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {survol != null && (
                <div className="absolute z-10 pointer-events-none bg-(--color-ink-900) text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap -translate-x-1/2"
                  style={{ left: `${((survol + 0.5) / points.length) * 100}%`, bottom: (points[survol].total / plafond) * H + 8 }}>
                  <span className="font-semibold">{points[survol].total}</span> rendez-vous · {formatJour(points[survol].date)}
                </div>
              )}
            </div>
            <div className="flex justify-between text-[11px] text-(--color-ink-300) mt-1.5">
              <span>{formatJour(points[0].date)}</span>
              <span>{formatJour(points[Math.floor(points.length / 2)].date)}</span>
              <span>{formatJour(points[points.length - 1].date)}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

/** Repartition des rendez-vous passes par statut : barres horizontales etiquetees. */
function RepartitionStatuts({ parStatut }) {
  const lignes = Object.entries(parStatut || {}).sort((a, b) => b[1] - a[1]);
  const total = lignes.reduce((s, [, v]) => s + v, 0);
  const max = Math.max(1, ...lignes.map(([, v]) => v));
  return (
    <Card className="p-5">
      <p className="font-display font-semibold text-(--color-ink-900)">Issue des rendez-vous</p>
      <p className="text-xs text-(--color-ink-600) mb-4">Rendez-vous passés sur la période</p>
      {total === 0 ? (
        <p className="text-sm text-(--color-ink-300)">Aucun rendez-vous sur la période.</p>
      ) : (
        <div className="space-y-3">
          {lignes.map(([statut, v]) => (
            <div key={statut}>
              <div className="flex justify-between text-sm">
                <span className="text-(--color-ink-900)">{LIBELLES_STATUT[statut] || statut}</span>
                <span className="text-(--color-ink-600) tabular-nums">{v} · {Math.round((100 * v) / total)} %</span>
              </div>
              <div className="h-2 mt-1 rounded-full bg-(--color-petrol-50)">
                <div className="h-2 rounded-full" style={{ width: `${(v / max) * 100}%`, background: COULEUR_SERIE }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * Tableau de bord partage Directeur / Admin a partir de /api/dashboard/statistiques.
 * `liens` permet de rendre certaines tuiles cliquables (ex: comptes en attente).
 */
export default function TableauStatistiques({ stats, admin = false, liens = {} }) {
  const tuiles = useMemo(() => [
    { libelle: 'Rendez-vous (30 j)', valeur: nombre(stats.rendezVous), precision: `${nombre(stats.teleconsultations)} en téléconsultation` },
    { libelle: "Taux d'absence", valeur: pourcent(stats.tauxAbsence), precision: 'Patients absents / rendez-vous effectués' },
    { libelle: "Taux d'acceptation", valeur: pourcent(stats.tauxAcceptation), precision: 'Demandes acceptées par les médecins' },
    { libelle: 'À venir (7 j)', valeur: nombre(stats.rendezVousAVenir7Jours), precision: `${nombre(stats.demandesEnAttente)} demande(s) en attente de réponse` },
    { libelle: 'Note moyenne des médecins', valeur: stats.noteMoyenneMedecins == null ? '—' : `${stats.noteMoyenneMedecins.toLocaleString('fr-FR')} / 5` },
    { libelle: admin ? 'Établissements' : 'Mes établissements', valeur: nombre(stats.etablissements), lien: liens.etablissements },
    { libelle: 'Médecins', valeur: nombre(stats.medecins), precision: `${nombre(stats.infirmiers)} infirmier(e)s` },
    { libelle: admin ? 'Patients inscrits' : 'Patients reçus', valeur: nombre(stats.patients), lien: liens.patients },
    { libelle: "Demandes d'adhésion", valeur: nombre(stats.demandesAdhesionEnAttente), precision: 'En attente de validation', lien: liens.adhesions },
    ...(admin ? [{ libelle: 'Comptes à valider', valeur: nombre(stats.comptesEnAttente), lien: liens.comptes }] : []),
  ], [stats, admin, liens]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {tuiles.map((t) => <Tuile key={t.libelle} {...t} />)}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><HistogrammeJours points={stats.rendezVousParJour} /></div>
        <RepartitionStatuts parStatut={stats.rendezVousParStatut} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="font-display font-semibold text-(--color-ink-900) mb-3">Médecins les plus sollicités</p>
          {stats.medecinsLesPlusSollicites.length === 0 ? (
            <p className="text-sm text-(--color-ink-300)">Aucun rendez-vous sur la période.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {stats.medecinsLesPlusSollicites.map((m) => (
                  <tr key={m.nomComplet} className="border-t border-(--color-petrol-50) first:border-0">
                    <td className="py-2">
                      <span className="text-(--color-ink-900) font-medium">{m.nomComplet}</span>
                      {m.specialite && <span className="block text-xs text-(--color-ink-600)">{m.specialite}</span>}
                    </td>
                    <td className="py-2 text-right tabular-nums text-(--color-ink-900)">{m.rendezVous} rdv</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card className="p-5">
          <p className="font-display font-semibold text-(--color-ink-900) mb-3">Soins à domicile (30 j)</p>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-(--color-ink-600)">Alertes reçues</dt><dd className="text-xl font-semibold text-(--color-ink-900) tabular-nums">{nombre(stats.alertes)}</dd></div>
            <div><dt className="text-(--color-ink-600)">Prises en charge</dt><dd className="text-xl font-semibold text-(--color-ink-900) tabular-nums">{nombre(stats.alertesPrisesEnCharge)}</dd></div>
            <div><dt className="text-(--color-ink-600)">Délai moyen de réponse</dt><dd className="text-xl font-semibold text-(--color-ink-900) tabular-nums">{stats.delaiMoyenReponseAlerteMinutes == null ? '—' : `${stats.delaiMoyenReponseAlerteMinutes.toLocaleString('fr-FR')} min`}</dd></div>
            <div><dt className="text-(--color-ink-600)">Note des infirmier(e)s</dt><dd className="text-xl font-semibold text-(--color-ink-900) tabular-nums">{stats.noteMoyenneInfirmieres == null ? '—' : `${stats.noteMoyenneInfirmieres.toLocaleString('fr-FR')} / 5`}</dd></div>
          </dl>
          {!admin && <p className="text-xs text-(--color-ink-300) mt-3">Interventions des infirmier(e)s rattaché(e)s à vos établissements.</p>}
        </Card>
      </div>
    </div>
  );
}
