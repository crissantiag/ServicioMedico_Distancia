import { api } from './api';

export const notificaciones = {
  listar: ({ page = 1 } = {}) => api.get('notificaciones', { page, per_page: 20 }),
  contador: async () => (await api.get('notificaciones/no-leidas')).data.total,
  marcarLeida: id => api.patch(`notificaciones/${id}/leida`),
  marcarTodas: () => api.post('notificaciones/leer-todas'),
  eliminar: id => api.delete(`notificaciones/${id}`),

  destinatarios: () => api.get('notificaciones/destinatarios'),
  
  enviar: body => api.post('notificaciones/enviar', body),
};

export function rutaDeNotificacion(datos) {
  if (datos?.id_receta) return `/recetas/${datos.id_receta}`;
  if (datos?.id_cita) return `/citas/${datos.id_cita}`;
  return null;
}