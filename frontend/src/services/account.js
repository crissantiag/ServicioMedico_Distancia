import { api } from './api';

export const HISTORY_PAGE_SIZE = 10;

export const account = {
  profile: () => api.get('auth/me'),
  update: body => api.put('auth/me', body),
  states: () => api.get('estados-cita'),
  appointments: (userId, { state = '', page = 1 } = {}) => {
    if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) throw new Error('No se pudo identificar tu perfil.');
    return api.get(`usuarios/${userId}/citas`, { id_estado: state, page, per_page: HISTORY_PAGE_SIZE });
  },
  appointment: id => {
    if (!/^[1-9]\d*$/.test(String(id))) throw new Error('La cita no es válida.');
    return api.get(`citas/${id}`);
  },
};
