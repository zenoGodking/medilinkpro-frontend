import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff } from 'lucide-react';
import { Button } from '../ui';

/**
 * Scanner de QR code dans le navigateur (camera arriere sur telephone, webcam sur ordinateur).
 * Appelle onCode(texte) des qu'un QR code est lu. La camera exige HTTPS (ou localhost).
 */
export default function ScannerQr({ onCode }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [actif, setActif] = useState(false);
  const [erreur, setErreur] = useState(null);
  const onCodeRef = useRef(onCode);
  useEffect(() => { onCodeRef.current = onCode; }, [onCode]);

  useEffect(() => {
    if (!actif) return undefined;
    let flux;
    let frame;
    let arrete = false;

    async function demarrer() {
      try {
        flux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (arrete) return;
        const video = videoRef.current;
        video.srcObject = flux;
        await video.play();
        const lire = () => {
          if (arrete) return;
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(video, 0, 0);
            const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(image.data, image.width, image.height);
            if (code?.data) {
              setActif(false);
              onCodeRef.current(code.data);
              return;
            }
          }
          frame = requestAnimationFrame(lire);
        };
        lire();
      } catch {
        setErreur("Caméra inaccessible : autorisez-la dans le navigateur (le site doit être en HTTPS).");
        setActif(false);
      }
    }
    demarrer();
    return () => {
      arrete = true;
      cancelAnimationFrame(frame);
      flux?.getTracks().forEach((t) => t.stop());
    };
  }, [actif]);

  return (
    <div className="space-y-3">
      <div className={`relative rounded-xl overflow-hidden bg-(--color-petrol-900) aspect-video ${actif ? '' : 'hidden'}`}>
        <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
        <div className="absolute inset-[18%] border-2 border-white/80 rounded-xl pointer-events-none" aria-hidden="true" />
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <Button onClick={() => { setErreur(null); setActif((a) => !a); }} className="w-full">
        {actif ? <><CameraOff size={16} /> Arrêter la caméra</> : <><Camera size={16} /> Scanner avec la caméra</>}
      </Button>
      {erreur && <p className="text-sm text-(--color-clay-500)">{erreur}</p>}
    </div>
  );
}
