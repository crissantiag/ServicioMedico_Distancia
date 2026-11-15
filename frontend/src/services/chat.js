import { api } from './api';

export const chat = {
  // Paciente: sus conversaciones. Médico: las que recibe.
  conversations: () => api.get('conversaciones'),
  // Crea (o recupera) la conversación del paciente con un médico.
  start: idMedico => api.post('conversaciones', { id_medico: idMedico }),
  // `after` = último id_mensaje que ya se tiene (así solo llegan los nuevos).
  messages: (id, after) => api.get(`conversaciones/${id}/mensajes`, { despues: after || '' }),
  send: (id, contenido) => api.post(`conversaciones/${id}/mensajes`, { contenido }),
};