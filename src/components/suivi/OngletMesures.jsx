import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, OctagonAlert, Trash2, Plus } from 'lucide-react';
import { getMesures, ajouterMesure, supprimerMesure } from '../../api/suivi';
import { Button, FieldLabel, TextInput, Spinner } from '../ui';
import GraphiqueMesures from './GraphiqueMesures';

const TYPES_MESURE = {
  TENSION: { libelle: 'Tension', unite: 'mmHg', zone: { min: 90, max: 140, libelle: 'Zone habituelle (systolique)' } },
  GLYCEMIE: { libelle: 'Glycemie', unite: 'g/L', zone: { min: 0.7, max: 1.26, libelle: 'Zone habituelle a jeun' } },
  POIDS: { libelle: 'Poids', unite: 'kg' },
  TEMPERATURE: { libelle: 'Temperature', unite: '°C', zone: { min: 36, max: 37.9, libelle: 'Zone habituelle' } },
  SATURATION_O2: { libelle: 'Oxygene (SpO2)', unite: '%', zone: { min: 95, max: 100, libelle: 'Zone habituelle' } },
};

const NIVEAUX = {
  NORMAL: { icon: CheckCircle2, libelle: 'Normal', classe: 'bg-(--color-sage-100) text-(--color-sage-500)' },
  ATTENTION: { icon: AlertTriangle, libelle: 'A surveiller', classe: 'bg-(--color-amber-400)/20 text-(--color-amber-500)' },
  ALERTE: { icon: OctagonAlert, libelle: 'Alerte', classe: 'bg-(--color-clay-100) text-(--color-clay-500)' },
};

function Niveau({ niveau }) {
  const n = NIVEAUX[niveau];
  if (!n) return null;
  const Icon = n.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${n.classe}`}>
      <Icon size={12} /> {n.libelle}
    </span>
  );
}

const valeurAffichee = (m) => (m.type === 'TENSION' ? `${m.valeur}/${m.valeur2}` : m.valeur.toLocaleString('fr-FR'));
const maintenantLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function OngletMesures({ patientId, peutEcrire }) {
  const [mesures, setMesures] = useState(null);
  const [type, setType] = useState('TENSION');
  const [form, setForm] = useState({ valeur: '', valeur2: '', aJeun: true, dateMesure: maintenantLocal(), note: '' });
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  const charger = useCallback(() => getMesures(patientId).then(setMesures).catch(() => setMesures([])), [patientId]);
  useEffect(() => { charger(); }, [charger]);

  const duType = useMemo(() => (mesures || []).filter((m) => m.type === type), [mesures, type]);
  const series = useMemo(() => {
    if (duType.length === 0) return null;
    const points = (champ) => duType.map((m) => ({ date: new Date(m.dateMesure), valeur: m[champ] }));
    return type === 'TENSION'
      ? [{ nom: 'Systolique', valeurs: points('valeur') }, { nom: 'Diastolique', valeurs: points('valeur2') }]
      : [{ nom: TYPES_MESURE[type].libelle, valeurs: points('valeur') }];
  }, [duType, type]);

  async function enregistrer(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      await ajouterMesure(patientId, {
        type,
        valeur: Number(form.valeur.replace(',', '.')),
        valeur2: type === 'TENSION' ? Number(form.valeur2.replace(',', '.')) : null,
        aJeun: type === 'GLYCEMIE' ? form.aJeun : null,
        dateMesure: form.dateMesure,
        note: form.note || null,
      });
      setForm((f) => ({ ...f, valeur: '', valeur2: '', note: '', dateMesure: maintenantLocal() }));
      await charger();
    } catch (err) {
      setErreur(err.response?.data?.message || "La mesure n'a pas pu etre enregistree.");
    } finally {
      setEnvoi(false);
    }
  }

  async function retirer(id) {
    await supprimerMesure(id);
    charger();
  }

  if (!mesures) return <div className="flex justify-center py-8"><Spinner className="w-5 h-5" /></div>;
  const conf = TYPES_MESURE[type];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {Object.entries(TYPES_MESURE).map(([cle, t]) => (
          <button key={cle} type="button" onClick={() => setType(cle)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${type === cle
              ? 'bg-(--color-petrol-600) text-white' : 'bg-(--color-petrol-50) text-(--color-ink-600) hover:bg-(--color-petrol-100)'}`}>
            {t.libelle}
          </button>
        ))}
      </div>

      {series ? (
        <div>
          <p className="text-sm font-semibold text-(--color-ink-900)">{conf.libelle} ({conf.unite})</p>
          <GraphiqueMesures series={series} unite={conf.unite} zone={conf.zone} titre={conf.libelle} />
        </div>
      ) : (
        <p className="text-sm text-(--color-ink-600)">Aucune mesure de {conf.libelle.toLowerCase()} pour le moment.</p>
      )}

      {peutEcrire && (
        <form onSubmit={enregistrer} className="rounded-xl bg-(--color-petrol-50) p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <FieldLabel>{type === 'TENSION' ? 'Systolique' : `Valeur (${conf.unite})`}</FieldLabel>
              <TextInput required inputMode="decimal" value={form.valeur} onChange={(e) => setForm((f) => ({ ...f, valeur: e.target.value }))}
                placeholder={type === 'TENSION' ? '120' : ''} />
            </div>
            {type === 'TENSION' && (
              <div>
                <FieldLabel>Diastolique</FieldLabel>
                <TextInput required inputMode="decimal" value={form.valeur2} onChange={(e) => setForm((f) => ({ ...f, valeur2: e.target.value }))} placeholder="80" />
              </div>
            )}
            <div className={type === 'TENSION' ? '' : 'sm:col-span-2'}>
              <FieldLabel>Date et heure</FieldLabel>
              <TextInput type="datetime-local" required max={maintenantLocal()} value={form.dateMesure}
                onChange={(e) => setForm((f) => ({ ...f, dateMesure: e.target.value }))} />
            </div>
            {type === 'GLYCEMIE' && (
              <label className="flex items-center gap-2 text-sm text-(--color-ink-600) self-end pb-3">
                <input type="checkbox" checked={form.aJeun} onChange={(e) => setForm((f) => ({ ...f, aJeun: e.target.checked }))} /> A jeun
              </label>
            )}
          </div>
          <TextInput placeholder="Note (optionnel) : apres effort, oubli de traitement..." value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          {erreur && <p className="text-sm text-(--color-clay-500)">{erreur}</p>}
          <Button type="submit" disabled={envoi}><Plus size={15} /> Ajouter la mesure</Button>
        </form>
      )}

      {duType.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-(--color-ink-600) border-b border-(--color-petrol-100)">
                <th className="py-2 pr-3 font-medium">Date</th>
                <th className="py-2 pr-3 font-medium">Valeur</th>
                <th className="py-2 pr-3 font-medium">Lecture</th>
                <th className="py-2 pr-3 font-medium">Saisie par</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-petrol-100)">
              {[...duType].reverse().map((m) => (
                <tr key={m.id}>
                  <td className="py-2 pr-3 whitespace-nowrap text-(--color-ink-600)">
                    {new Date(m.dateMesure).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2 pr-3 font-semibold text-(--color-ink-900) whitespace-nowrap">
                    {valeurAffichee(m)} {m.unite}{m.type === 'GLYCEMIE' && <span className="font-normal text-(--color-ink-600)"> {m.aJeun ? '(a jeun)' : '(non a jeun)'}</span>}
                  </td>
                  <td className="py-2 pr-3">
                    <Niveau niveau={m.niveau} />
                    {m.interpretation && <p className="text-xs text-(--color-ink-600) mt-0.5">{m.interpretation}</p>}
                    {m.note && <p className="text-xs text-(--color-ink-300) mt-0.5">{m.note}</p>}
                  </td>
                  <td className="py-2 pr-3 text-xs text-(--color-ink-600)">{m.saisieParRole === 'MEDECIN' ? 'Medecin' : 'Auto-mesure'}</td>
                  <td className="py-2 text-right">
                    {m.saisieParMoi && (
                      <button type="button" onClick={() => retirer(m.id)} aria-label="Supprimer la mesure"
                        className="p-1.5 rounded-lg text-(--color-ink-300) hover:text-(--color-clay-500) hover:bg-(--color-clay-100)">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-(--color-ink-300)">
        Lecture indicative (seuils usuels chez l'adulte) : elle ne remplace pas l'avis de votre medecin.
      </p>
    </div>
  );
}
