// Tokens en memoria: cerrar la app requiere iniciar sesión de nuevo.
let session = null;
let renewal = null;
let generation = 0;
const listeners = new Set();
export function subscribeLogout(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
export function clearSession() {
  generation += 1;
  session = null;
  listeners.forEach(callback => callback());
}
export function setSession(data) {
  generation += 1;
  session = {
    token: data.idToken || data.id_token,
    refresh: data.refreshToken || data.refresh_token,
    expires: Date.now() + Number(data.expiresIn || data.expires_in) * 1000,
  };
}
export async function requestJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(body?.message || body?.error?.message || 'No se pudo completar la solicitud.');
      error.status = response.status;
      error.errors = body?.errors;
      throw error;
    }
    if (!body) throw new Error('El servicio devolvió una respuesta inesperada.');
    return body;
  } catch (error) {
    if (error.status) throw error;
    throw new Error('No se pudo conectar. Revisa tu conexión y la dirección de la API.');
  } finally {
    clearTimeout(timeout);
  }
}
export async function getToken() {
  if (!session) throw new Error('Debes iniciar sesión.');
  if (session.expires > Date.now() + 60000) return session.token;
  if (!renewal) {
    const version = generation;
    const key = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
    renewal = requestJson(`https://securetoken.googleapis.com/v1/token?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(session.refresh)}`,
    }).then(data => {
      if (generation !== version) throw new Error('La sesión cambió. Vuelve a ingresar.');
      setSession(data);
      return session.token;
    }).catch(error => {
      if ((error.status === 400 || error.status === 401) && generation === version) clearSession();
      throw error;
    }).finally(() => { renewal = null; });
  }
  return renewal;
}
