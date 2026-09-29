import { Phone, Droplet, ShieldAlert, FileText, FlaskConical, Pill, Activity } from 'lucide-react';
import { Card } from './ui';
import { libelleGroupeSanguin } from '../utils/groupeSanguin';

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString('fr-FR') : '—';
}

function Section({ icon: Icon, titre, vide, children }) {
  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-display font-semibold text-(--color-petrol-700) mb-3">
        <Icon size={17} /> {titre}
      </h2>
      {vide ? <p className="text-sm text-(--color-ink-600)">Aucun element.</p> : children}
    </Card>
  );
}

/**
 * Contenu d'un carnet medical (identite medicale, consultations, ordonnances, analyses),
 * en lecture. Partage entre le carnet d'urgence (reconnaissance faciale) et le carnet
 * consulte par un medecin.
 */
export default function CarnetSections({ carnet, photoReference }) {
  const p = carnet.patient;
  return (
    <>
      <Card className="p-5 flex flex-col sm:flex-row gap-5">
        {photoReference && (
          <img src={photoReference} alt="Photo de reference" className="w-32 h-32 rounded-xl object-cover border border-(--color-petrol-100)" />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          <div className="rounded-xl bg-(--color-clay-100) p-3">
            <p className="flex items-center gap-1 text-xs font-semibold text-(--color-clay-500)"><Droplet size={13} /> Groupe sanguin</p>
            <p className="font-display font-bold text-2xl text-(--color-clay-500)">{libelleGroupeSanguin(p.groupeSanguin)}</p>
          </div>
          <div className="rounded-xl bg-(--color-amber-400)/15 p-3">
            <p className="flex items-center gap-1 text-xs font-semibold text-(--color-amber-500)"><ShieldAlert size={13} /> Allergies</p>
            <p className="text-sm font-semibold text-(--color-petrol-700) mt-1">{p.allergies || 'Aucune declaree'}</p>
          </div>
          <div className="rounded-xl bg-(--color-petrol-50) p-3">
            <p className="flex items-center gap-1 text-xs font-semibold text-(--color-petrol-600)"><Phone size={13} /> Proche</p>
            {p.contactUrgenceTelephone ? (
              <a href={`tel:${p.contactUrgenceTelephone}`} className="text-sm font-semibold text-(--color-petrol-700) hover:underline">
                {p.contactUrgenceNom ? `${p.contactUrgenceNom} — ` : ''}{p.contactUrgenceTelephone}
              </a>
            ) : <p className="text-sm text-(--color-ink-600)">Non renseigne</p>}
          </div>
          {p.conditionsUrgence && (
            <div className="sm:col-span-3 rounded-xl bg-(--color-clay-100) p-3">
              <p className="flex items-center gap-1 text-xs font-semibold text-(--color-clay-500)"><Activity size={13} /> A signaler en urgence</p>
              <p className="text-sm font-semibold text-(--color-petrol-700) mt-1">{p.conditionsUrgence}</p>
            </div>
          )}
          <div className="sm:col-span-3 text-sm text-(--color-ink-600) space-y-1">
            <p>Date de naissance : <strong>{formatDate(p.dateNaissance)}</strong></p>
            <p>Telephone du patient : <strong>{p.telephone || '—'}</strong></p>
            <p>Antecedents : <strong>{p.antecedents || 'Aucun renseigne'}</strong></p>
          </div>
        </div>
      </Card>

      <Section icon={FileText} titre="Consultations" vide={carnet.consultations.length === 0}>
        <ul className="divide-y divide-(--color-petrol-100)">
          {carnet.consultations.map((c) => (
            <li key={c.id} className="py-3 text-sm">
              <p className="font-semibold text-(--color-petrol-700)">{formatDate(c.date)} — Dr {c.medecinNomComplet}</p>
              {c.motif && <p className="text-(--color-ink-600)">Motif : {c.motif}</p>}
              {c.diagnostic && <p className="text-(--color-ink-600)">Diagnostic : {c.diagnostic}</p>}
            </li>
          ))}
        </ul>
      </Section>

      <Section icon={Pill} titre="Ordonnances" vide={carnet.ordonnances.length === 0}>
        <ul className="divide-y divide-(--color-petrol-100)">
          {carnet.ordonnances.map((o) => (
            <li key={o.id} className="py-3 text-sm">
              <p className="font-semibold text-(--color-petrol-700)">{formatDate(o.dateEmission)} — Dr {o.medecinNomComplet}</p>
              <p className="text-(--color-ink-600) whitespace-pre-line">{o.medicaments}</p>
              {o.posologie && <p className="text-(--color-ink-600) whitespace-pre-line">Posologie : {o.posologie}</p>}
            </li>
          ))}
        </ul>
      </Section>

      <Section icon={FlaskConical} titre="Resultats d'analyses" vide={carnet.resultatsAnalyses.length === 0}>
        <ul className="divide-y divide-(--color-petrol-100)">
          {carnet.resultatsAnalyses.map((r) => (
            <li key={r.id} className="py-3 text-sm">
              <p className="font-semibold text-(--color-petrol-700)">{r.type} — {formatDate(r.dateResultat)}</p>
              <p className="text-(--color-ink-600)">{[r.laboratoire, r.statut].filter(Boolean).join(' · ')}</p>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
