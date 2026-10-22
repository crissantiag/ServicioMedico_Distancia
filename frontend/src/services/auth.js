import { api } from './api';
import { clearSession, requestJson, setSession } from './session';

const messages = {
  EMAIL_EXISTS: 'Ese correo ya tiene cuenta. Inicia sesión.',
  INVALID_EMAIL: 'Revisa el formato del correo.',
  INVALID_LOGIN_CREDENTIALS: 'Correo o contraseña incorrectos.',
  EMAIL_NOT_FOUND: 'Correo o contraseña incorrectos.',
  INVALID_PASSWORD: 'Correo o contraseña incorrectos.',
  USER_DISABLED: 'Esta cuenta está deshabilitada.',
  TOO_MANY_ATTEMPTS_TRY_LATER: 'Demasiados intentos. Espera un momento.',
};
async function firebase(action, body) {
  const key = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  if (!key) throw new Error('Falta configurar la clave pública de Firebase.');
  try {
    return await requestJson(`https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
  } catch (error) {
    const code = error.message.split(' : ')[0];
    throw new Error(messages[code] || (code === 'WEAK_PASSWORD' ? 'Usa una contraseña de al menos 6 caracteres.' :
      error.status ? 'No se pudo iniciar sesión en Firebase. Intenta nuevamente.' : error.message));
  }
}
export async function login(email, password) {
  clearSession();
  const credentials = await firebase('signInWithPassword', { email: email.trim(), password, returnSecureToken: true });
  setSession(credentials);
  try { return (await api.get('auth/me')).data; }
  catch (error) { clearSession(); throw error; }
}
export async function register(name, email, password) {
  clearSession();
  const credentials = await firebase('signUp', { email: email.trim(), password, returnSecureToken: true });
  setSession(credentials);
  try {
    const updated = await firebase('update', { idToken: credentials.idToken, displayName: name.trim(), returnSecureToken: true });
    if (updated.idToken) setSession({ ...credentials, ...updated });
    await api.get('auth/me');
    return (await api.put('auth/me', { nombre_completo: name.trim() })).data;
  } catch (error) {
    clearSession();
    throw new Error(`La cuenta se creó en Firebase, pero falta completar el perfil: ${error.message} Vuelve a iniciar sesión; no repitas el registro.`);
  }
}
export const logout = clearSession;
