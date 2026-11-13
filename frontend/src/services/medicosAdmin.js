import { api } from './api';

export const MEDICOS_PAGE_SIZE = 10;
const idValido = id => {
  if (!/^[1-9]\d*$/.test(String(id))) throw new Error('El médico seleccionado no es válido.');
  return Number(id);
};

export const medicosAdmin = {
  list: (page = 1) => api.get('admin/medicos', { page, per_page: MEDICOS_PAGE_SIZE }),
  detail: id => api.get(`admin/medicos/${idValido(id)}`),
  create: data => api.post('admin/medicos', data),
  update: (id, data) => api.put(`admin/medicos/${idValido(id)}`, data),
  remove: id => api.delete(`admin/medicos/${idValido(id)}`),
  centers: async () => {
    const items = [];
    let page = 1;
    let lastPage = 1;
    do {
      const result = await api.get('admin/centros-medicos', { page, per_page: 100 });
      items.push(...result.data);
      lastPage = result.meta?.last_page || 1;
      page += 1;
    } while (page <= lastPage);
    return items;
  },
  specialties: async () => {
    const items = [];
    let page = 1;
    let lastPage = 1;
    do {
      const result = await api.get('admin/especialidades', { page, per_page: 100 });
      items.push(...result.data);
      lastPage = result.meta?.last_page || 1;
      page += 1;
    } while (page <= lastPage);
    return items;
  },
};

export function medicoForm(medico = {}) {
  return {
    nombre_completo: medico.nombre_completo || '',
    id_especialidad: medico.id_especialidad ? String(medico.id_especialidad) : '',
    idioma: medico.idioma || 'Español',
    centros: (medico.centros || []).map(centro => String(centro.id_centro)),
    disponibilidad: medico.disponibilidad || '',
  };
}

export function validateMedico(form) {
  const errors = {};
  if (!form.nombre_completo.trim() || form.nombre_completo.trim().length > 150) errors.nombre_completo = 'Escribe el nombre completo (máximo 150 caracteres).';
  if (!/^[1-9]\d*$/.test(String(form.id_especialidad))) errors.id_especialidad = 'Selecciona una especialidad.';
  if (!Array.isArray(form.centros) || form.centros.some(id => !/^[1-9]\d*$/.test(String(id)))) errors.centros = 'Selecciona centros médicos válidos.';
  if (form.disponibilidad.trim().length > 255) errors.disponibilidad = 'La disponibilidad admite hasta 255 caracteres.';
  return errors;
}

export function medicoPayload(form) {
  return {
    nombre_completo: form.nombre_completo.trim(),
    id_especialidad: Number(form.id_especialidad),
    idioma: form.idioma.trim() || 'Español',
    centros: [...new Set(form.centros.map(Number))],
    disponibilidad: form.disponibilidad.trim() || null,
  };
}
