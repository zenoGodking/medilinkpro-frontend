/**
 * Reconnaissance faciale cote navigateur (face-api). Calcule l'empreinte faciale
 * (128 reels) envoyee au backend, qui se charge de la comparaison. La librairie et
 * ses modeles (~12 Mo, servis depuis /models) ne sont charges qu'a la premiere utilisation.
 */
const MODELS_URL = '/models';
const TAILLE_MAX_PX = 640;

let faceapiPromise = null;

function chargerFaceApi() {
  if (!faceapiPromise) {
    faceapiPromise = (async () => {
      const faceapi = await import('@vladmandic/face-api');
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
      ]);
      return faceapi;
    })().catch((err) => {
      faceapiPromise = null;
      throw err;
    });
  }
  return faceapiPromise;
}

/** Redimensionne l'image (max 640 px) : allege l'envoi et accelere la detection. */
async function versCanvas(fichier) {
  const bitmap = await createImageBitmap(fichier);
  const ratio = Math.min(1, TAILLE_MAX_PX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

/**
 * Entoure l'image d'une marge : le detecteur SSD rate souvent les visages qui remplissent
 * tout le cadre (selfie tres rapproche, photo d'identite recadree).
 */
function avecMarge(canvas) {
  const marge = Math.round(Math.max(canvas.width, canvas.height) * 0.5);
  const cadre = document.createElement('canvas');
  cadre.width = canvas.width + 2 * marge;
  cadre.height = canvas.height + 2 * marge;
  const ctx = cadre.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, cadre.width, cadre.height);
  ctx.drawImage(canvas, marge, marge);
  return cadre;
}

function versBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
}

/**
 * Analyse une photo et retourne { descripteur: number[128], photo: Blob jpeg redimensionne }.
 * - visageUnique=true (inscription) : refuse la photo si 0 ou plusieurs visages.
 * - visageUnique=false (scan d'urgence) : retient le plus grand visage detecte.
 * Leve une Error avec un message affichable en cas d'echec.
 */
export async function extraireEmpreinte(fichier, { visageUnique = true } = {}) {
  const faceapi = await chargerFaceApi();
  const canvas = await versCanvas(fichier);

  const detecter = (image) => faceapi
    .detectAllFaces(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptors();

  let detections = await detecter(canvas);
  if (detections.length === 0) {
    detections = await detecter(avecMarge(canvas));
  }

  if (detections.length === 0) {
    throw new Error('Aucun visage detecte. Prenez une photo de face, bien eclairee, sans lunettes de soleil.');
  }
  if (visageUnique && detections.length > 1) {
    throw new Error('Plusieurs visages detectes. La photo ne doit montrer que le patient.');
  }

  const aire = (d) => d.detection.box.width * d.detection.box.height;
  const principal = detections.reduce((a, b) => (aire(b) > aire(a) ? b : a));

  return {
    descripteur: Array.from(principal.descriptor),
    photo: await versBlob(canvas),
    visagesDetectes: detections.length,
  };
}
