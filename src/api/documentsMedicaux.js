import { api } from './client';
import { compresserImage } from '../utils/compressionImage';

export async function getDocumentsMedicaux(patientId) {
  const { data } = await api.get(`/api/documents-medicaux/patients/${patientId}`);
  return data;
}

// Ajoute un document (metadonnees + 1 a 20 fichiers : photos scannees ou PDF).
export async function ajouterDocumentMedical(patientId, donnees, fichiers) {
  const formData = new FormData();
  formData.append('donnees', new Blob([JSON.stringify(donnees)], { type: 'application/json' }));
  const legers = await Promise.all(fichiers.map((f) => compresserImage(f)));
  legers.forEach((f) => formData.append('fichiers', f, f.name));
  const { data } = await api.post(`/api/documents-medicaux/patients/${patientId}`, formData, {
    headers: { 'Content-Type': undefined },
  });
  return data;
}

// Les pages sont protegees par le JWT : on les telecharge en Blob pour les afficher.
export async function getPageDocument(documentId, index) {
  const { data } = await api.get(`/api/documents-medicaux/${documentId}/pages/${index}`, { responseType: 'blob' });
  return data;
}

export async function supprimerDocumentMedical(documentId) {
  await api.delete(`/api/documents-medicaux/${documentId}`);
}
