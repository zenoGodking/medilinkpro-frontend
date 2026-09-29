import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Spinner } from './ui';
import { extraireEmpreinte } from '../utils/faceRecognition';

/**
 * Prise (ou choix) d'une photo de visage, analysee immediatement dans le navigateur.
 * Sur mobile, capture ouvre directement l'appareil photo (camera frontale pour l'inscription,
 * camera arriere pour scanner une personne). Appelle onResultat({ descripteur, photo }) une fois
 * un visage detecte, ou onResultat(null) si la photo est retiree/invalide.
 */
export default function CapturePhotoVisage({ onResultat, visageUnique = true, capture = 'user', libelle }) {
  const inputRef = useRef(null);
  const [apercu, setApercu] = useState(null);
  const [etat, setEtat] = useState('vide'); // vide | analyse | ok | erreur
  const [message, setMessage] = useState('');

  useEffect(() => () => apercu && URL.revokeObjectURL(apercu), [apercu]);

  async function handleFichier(e) {
    const fichier = e.target.files?.[0];
    e.target.value = '';
    if (!fichier) return;

    setApercu(URL.createObjectURL(fichier));
    setEtat('analyse');
    setMessage('');
    onResultat(null);
    try {
      const resultat = await extraireEmpreinte(fichier, { visageUnique });
      setEtat('ok');
      setMessage(resultat.visagesDetectes > 1
        ? `${resultat.visagesDetectes} visages detectes : le plus grand a ete retenu.`
        : 'Visage detecte.');
      onResultat(resultat);
    } catch (err) {
      setEtat('erreur');
      setMessage(err.message || "Impossible d'analyser la photo.");
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={capture}
        onChange={handleFichier}
        className="hidden"
      />

      {apercu ? (
        <div className="flex items-center gap-4">
          <img src={apercu} alt="Photo du visage" className="w-24 h-24 rounded-xl object-cover border border-(--color-petrol-100)" />
          <div className="flex-1 min-w-0 space-y-2">
            {etat === 'analyse' && (
              <p className="flex items-center gap-2 text-sm text-(--color-ink-600)">
                <Spinner className="w-4 h-4" /> Analyse du visage...
              </p>
            )}
            {etat === 'ok' && (
              <p className="flex items-center gap-1.5 text-sm text-(--color-sage-500)">
                <CheckCircle2 size={16} className="shrink-0" /> {message}
              </p>
            )}
            {etat === 'erreur' && (
              <p className="flex items-start gap-1.5 text-sm text-(--color-clay-500)">
                <AlertCircle size={16} className="shrink-0 mt-0.5" /> {message}
              </p>
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={etat === 'analyse'}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-(--color-petrol-600) hover:underline disabled:opacity-50"
            >
              <RefreshCw size={14} /> Reprendre la photo
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-(--color-petrol-200) text-(--color-petrol-600) hover:border-(--color-petrol-400) hover:bg-(--color-petrol-50) transition-colors"
        >
          <Camera size={26} strokeWidth={1.75} />
          <span className="text-sm font-semibold">{libelle || 'Prendre une photo du visage'}</span>
          <span className="text-xs text-(--color-ink-600)">De face, bien eclaire, sans lunettes de soleil</span>
        </button>
      )}
    </div>
  );
}
