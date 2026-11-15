import { api } from './api';

export const FORO_PAGE_SIZE = 10;
export const FORO_COMENTARIOS_PAGE_SIZE = 20;

const validId = (id, message) => {
  if (!/^[1-9]\d*$/.test(String(id))) throw new Error(message);
};

export const foro = {
  // Publicaciones. q = texto a buscar; mias = solo las del usuario.
  listar: ({ page = 1, q = '', mias = false } = {}) =>
    api.get('foro', { page, per_page: FORO_PAGE_SIZE, q: q.trim(), mias: mias ? 1 : '' }),
  ver: id => {
    validId(id, 'La publicación no es válida.');
    return api.get(`foro/${id}`);
  },
  // body: { titulo, contenido }
  crear: body => api.post('foro', body),
  editar: (id, body) => {
    validId(id, 'La publicación no es válida.');
    return api.put(`foro/${id}`, body);
  },
  eliminar: id => {
    validId(id, 'La publicación no es válida.');
    return api.delete(`foro/${id}`);
  },
  // Comentarios (respuestas de la comunidad), en orden cronológico.
  comentarios: (id, { page = 1 } = {}) => {
    validId(id, 'La publicación no es válida.');
    return api.get(`foro/${id}/comentarios`, { page, per_page: FORO_COMENTARIOS_PAGE_SIZE });
  },
  comentar: (id, contenido) => {
    validId(id, 'La publicación no es válida.');
    return api.post(`foro/${id}/comentarios`, { contenido });
  },
  eliminarComentario: id => {
    validId(id, 'El comentario no es válido.');
    return api.delete(`foro/comentarios/${id}`);
  },
  // Alterna "Me apoya". Responde { apoyado_por_mi, apoyos_count }.
  apoyar: id => {
    validId(id, 'La publicación no es válida.');
    return api.post(`foro/${id}/apoyo`);
  },
};
