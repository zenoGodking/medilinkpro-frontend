import { api } from './client';

export async function getNotifications() {
  const { data } = await api.get('/api/notifications');
  return data;
}

export async function getNombreNonLues() {
  const { data } = await api.get('/api/notifications/non-lues');
  return data.nombre;
}

export async function marquerNotificationLue(id) {
  await api.patch(`/api/notifications/${id}/lue`);
}

export async function marquerToutesLues() {
  await api.patch('/api/notifications/lues');
}
