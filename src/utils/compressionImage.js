// Reduction des photos avant envoi : un scan de carnet pris au telephone passe typiquement de
// 3-5 Mo a ~300 Ko, ce qui change tout sur une connexion 2G/3G. Les PDF ne sont pas modifies.

const DIMENSION_MAX = 1800;
const QUALITE = 0.78;
const SEUIL_OCTETS = 400 * 1024;

/** Retourne un nouveau File JPEG compresse, ou le fichier d'origine s'il est deja leger / non image. */
export async function compresserImage(fichier, { dimensionMax = DIMENSION_MAX, qualite = QUALITE } = {}) {
  if (!(fichier instanceof Blob) || !fichier.type?.startsWith('image/') || fichier.size < SEUIL_OCTETS) {
    return fichier;
  }
  try {
    const bitmap = await createImageBitmap(fichier);
    const ratio = Math.min(1, dimensionMax / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', qualite));
    if (!blob || blob.size >= fichier.size) return fichier;
    const nom = (fichier.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], nom, { type: 'image/jpeg' });
  } catch {
    return fichier;
  }
}
