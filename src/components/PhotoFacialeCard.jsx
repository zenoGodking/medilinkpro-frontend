import { useEffect, useState } from 'react';
import { ScanFace, CheckCircle2 } from 'lucide-react';
import { Card, Button } from './ui';
import CapturePhotoVisage from './CapturePhotoVisage';
import { getMaPhotoFaciale, enregistrerMaPhotoFaciale } from '../api/reconnaissanceFaciale';

/**
 * Photo faciale du patient connecte : indispensable pour etre retrouve par reconnaissance faciale
 * en cas d'accident. Mise en avant si elle manque (comptes crees avant cette fonctionnalite).
 */
export default function PhotoFacialeCard() {
  const [photo, setPhoto] = useState(undefined); // undefined = chargement, null = absente
  const [edition, setEdition] = useState(false);
  const [visage, setVisage] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    getMaPhotoFaciale().then(setPhoto).catch(() => setPhoto(null));
  }, []);

  async function enregistrer() {
    setEnvoi(true);
    setErreur(null);
    try {
      await enregistrerMaPhotoFaciale(visage);
      setPhoto(await getMaPhotoFaciale());
      setEdition(false);
      setVisage(null);
    } catch (err) {
      setErreur(err.response?.data?.message || "La photo n'a pas pu être enregistrée.");
    } finally {
      setEnvoi(false);
    }
  }

  if (photo === undefined) return null;

  const manquante = photo === null;
  return (
    <Card className={`p-5 ${manquante ? 'border-(--color-clay-500)/40' : ''}`}>
      <div className="flex items-start gap-4">
        {photo ? (
          <img src={photo} alt="Ma photo de référence" className="w-16 h-16 rounded-xl object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-(--color-clay-100) flex items-center justify-center text-(--color-clay-500) shrink-0">
            <ScanFace size={26} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-semibold text-(--color-petrol-700) flex items-center gap-1.5">
            {manquante ? 'Ajoutez votre photo pour les urgences' : (
              <><CheckCircle2 size={16} className="text-(--color-sage-500)" /> Photo d'urgence enregistrée</>
            )}
          </h2>
          <p className="text-sm text-(--color-ink-600) mt-0.5">
            En cas d'accident, les secours pourront retrouver votre groupe sanguin, vos allergies
            et le numéro de votre proche en scannant votre visage.
          </p>
          {!edition && (
            <Button variant={manquante ? 'primary' : 'ghost'} className="mt-3" onClick={() => setEdition(true)}>
              {manquante ? 'Ajouter ma photo' : 'Changer ma photo'}
            </Button>
          )}
        </div>
      </div>

      {edition && (
        <div className="mt-4 space-y-3">
          <CapturePhotoVisage onResultat={setVisage} />
          {erreur && <p className="text-sm text-(--color-clay-500)">{erreur}</p>}
          <div className="flex gap-2">
            <Button onClick={enregistrer} disabled={!visage || envoi}>
              {envoi ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
            <Button variant="ghost" onClick={() => { setEdition(false); setVisage(null); }}>Annuler</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
