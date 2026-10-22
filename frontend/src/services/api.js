import { clearSession, getToken, requestJson } from './session';

// Las pantallas no construyen headers ni conocen tokens.
export async function apiRequest(path, { method = 'GET', params, body } = {}) {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!base) throw new Error('Configura EXPO_PUBLIC_API_URL en .env.local.');
  if (/^[a-z]+:/i.test(path) || path.startsWith('//')) throw new Error('Usa una ruta relativa de la API.');
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) query.set(key, String(value));
  });
  const token = await getToken();
  try {
    const result = await requestJson(`${base}/${path.replace(/^\//, '')}${query.size ? `?${query}` : ''}`, {
      method,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (result.success !== true) throw new Error(result.message || 'La API no pudo completar la solicitud.');
    return result;
  } catch (error) {
    if (error.status === 401) {
      clearSession();
      throw new Error('Tu acceso ya no es válido. Vuelve a ingresar.');
    }
    throw error;
  }
}
export const api = {
  get: (path, params) => apiRequest(path, { params }),
  post: (path, body) => apiRequest(path, { method: 'POST', body }),
  put: (path, body) => apiRequest(path, { method: 'PUT', body }),
  patch: (path, body) => apiRequest(path, { method: 'PATCH', body }),
  delete: path => apiRequest(path, { method: 'DELETE' }),
};
