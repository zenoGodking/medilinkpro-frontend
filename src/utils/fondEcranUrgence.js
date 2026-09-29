import QRCode from 'qrcode';
import { libelleGroupeSanguin } from './groupeSanguin';

const LARGEUR = 1080;
const HAUTEUR = 2340;

function lignes(ctx, texte, largeurMax) {
  const mots = texte.split(/\s+/);
  const resultat = [];
  let ligne = '';
  for (const mot of mots) {
    const essai = ligne ? `${ligne} ${mot}` : mot;
    if (ctx.measureText(essai).width > largeurMax && ligne) {
      resultat.push(ligne);
      ligne = mot;
    } else {
      ligne = essai;
    }
  }
  if (ligne) resultat.push(ligne);
  return resultat;
}

/**
 * Fond d'ecran d'ecran de verrouillage (1080x2340, format telephone) : QR code de la carte
 * d'urgence, et si le patient le souhaite ses informations d'urgence lisibles sans application.
 * Le haut de l'image reste libre pour l'horloge de l'ecran verrouille.
 */
export async function genererFondEcran({ lien, patient, afficherInfos }) {
  const canvas = document.createElement('canvas');
  canvas.width = LARGEUR;
  canvas.height = HAUTEUR;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#12393d';
  ctx.fillRect(0, 0, LARGEUR, HAUTEUR);

  // Bandeau "Urgence medicale"
  const haut = 820;
  ctx.fillStyle = '#c2553f';
  ctx.fillRect(0, haut, LARGEUR, 130);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('URGENCE MEDICALE', LARGEUR / 2, haut + 88);

  // QR code sur fond blanc
  const tailleQr = 520;
  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, lien, { width: tailleQr, margin: 2, errorCorrectionLevel: 'M' });
  const xQr = (LARGEUR - tailleQr) / 2;
  const yQr = haut + 190;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(xQr - 20, yQr - 20, tailleQr + 40, tailleQr + 40);
  ctx.drawImage(qr, xQr, yQr);

  ctx.fillStyle = '#ffffff';
  ctx.font = '40px sans-serif';
  let y = yQr + tailleQr + 90;
  ctx.fillText('Scannez ce code avec MediLinkPro', LARGEUR / 2, y);

  if (afficherInfos && patient) {
    const infos = [
      `${patient.prenom} - Groupe sanguin : ${libelleGroupeSanguin(patient.groupeSanguin)}`,
      patient.allergies && `Allergies : ${patient.allergies}`,
      patient.conditionsUrgence && `A signaler : ${patient.conditionsUrgence}`,
      patient.contactUrgenceTelephone
        && `Prevenir : ${patient.contactUrgenceNom ? `${patient.contactUrgenceNom} ` : ''}${patient.contactUrgenceTelephone}`,
    ].filter(Boolean);
    ctx.font = 'bold 44px sans-serif';
    y += 40;
    for (const info of infos) {
      for (const l of lignes(ctx, info, LARGEUR - 160)) {
        y += 66;
        ctx.fillText(l, LARGEUR / 2, y);
      }
    }
  }

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
