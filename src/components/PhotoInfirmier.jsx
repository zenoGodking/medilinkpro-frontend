import { useEffect, useState } from 'react';
import { UserRound } from 'lucide-react';
import { getPhotoInfirmier } from '../api/infirmiers';

/**
 * Photo de profil d'une infirmiere, chargee avec le JWT (dossier prive cote serveur).
 * `version` permet de forcer le rechargement apres un changement de photo.
 */
export default function PhotoInfirmier({ infirmierId, disponible = true, version = 0, className = 'w-16 h-16', alt = 'Photo' }) {
  const [resultat, setResultat] = useState({ cle: null, url: null });
  const cle = `${infirmierId}|${version}`;

  useEffect(() => {
    if (!infirmierId || !disponible) return undefined;
    let annule = false;
    let url = null;
    getPhotoInfirmier(infirmierId)
      .then((blob) => {
        if (annule) return;
        url = URL.createObjectURL(blob);
        setResultat({ cle, url });
      })
      .catch(() => { if (!annule) setResultat({ cle, url: null }); });
    return () => {
      annule = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [infirmierId, disponible, cle]);

  const url = disponible && resultat.cle === cle ? resultat.url : null;
  return (
    <div className={`${className} rounded-full overflow-hidden bg-(--color-petrol-50) flex items-center justify-center shrink-0 border-2 border-white shadow`}>
      {url
        ? <img src={url} alt={alt} className="w-full h-full object-cover" />
        : <UserRound className="w-1/2 h-1/2 text-(--color-petrol-400)" />}
    </div>
  );
}
