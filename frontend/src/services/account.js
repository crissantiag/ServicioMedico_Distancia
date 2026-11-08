import { api } from './api';

export const HISTORY_PAGE_SIZE = 10;
export const PRESCRIPTION_PAGE_SIZE = 10;

const validId = (id, message) => {
  if (!/^[1-9]\d*$/.test(String(id))) throw new Error(message);
};

export const account = {
  profile: () => api.get('auth/me'),
  update: body => api.put('auth/me', body),
  states: () => api.get('estados-cita'),
  // Paciente: sus citas. Médico: las citas que atiende (la API filtra según el rol).
  appointments: (userId, { state = '', page = 1, role = 'paciente', patient = '' } = {}) => {
    if (role === 'medico') {
      return api.get('citas', { id_estado: state, id_usuario: patient, page, per_page: HISTORY_PAGE_SIZE });
    }
    if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) throw new Error('No se pudo identificar tu perfil.');
    return api.get(`usuarios/${userId}/citas`, { id_estado: state, page, per_page: HISTORY_PAGE_SIZE });
  },
  // Médico: pacientes distintos entre sus citas (para el filtro "Paciente").
  patients: () => api.get('citas', { per_page: 100 }),
  // Agenda de "Mis citas": las 100 más recientes del paciente o del médico (la API filtra por rol).
  agenda: () => api.get('citas', { per_page: 100 }),
  appointment: id => {
    validId(id, 'La cita no es válida.');
    return api.get(`citas/${id}`);
  },
  // Recetas: paciente = las suyas, médico = las de sus citas.
  prescriptions: ({ page = 1 } = {}) => api.get('recetas', { page, per_page: PRESCRIPTION_PAGE_SIZE }),
  prescription: id => {
    validId(id, 'La receta no es válida.');
    return api.get(`recetas/${id}`);
  },
  medications: () => api.get('medicamentos'),
  // body: { id_cita, indicaciones_generales, medicamentos: [{ id_medicamento, dosis, frecuencia, duracion }] }
  createPrescription: body => api.post('recetas', body),
  // body: { indicaciones_generales, medicamentos: [...] } (reemplaza la lista completa)
  updatePrescription: (id, body) => {
    validId(id, 'La receta no es válida.');
    return api.put(`recetas/${id}`, body);
  },
  deletePrescription: id => {
    validId(id, 'La receta no es válida.');
    return api.delete(`recetas/${id}`);
  },
};
