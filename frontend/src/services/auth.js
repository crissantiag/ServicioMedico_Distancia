import { api } from './api';
import { clearSession, requestJson, sessionVersion, setSession } from './session';

const messages = {
  EMAIL_EXISTS: 'Ese correo ya tiene cuenta. Inicia sesión.',
  INVALID_EMAIL: 'Revisa el formato del correo.',
  INVALID_LOGIN_CREDENTIALS: 'Correo o contraseña incorrectos.',
  EMAIL_NOT_FOUND: 'Correo o contraseña incorrectos.',
  INVALID_PASSWORD: 'Correo o contraseña incorrectos.',
  CREDENTIAL_TOO_OLD_LOGIN_AGAIN: 'Vuelve a iniciar sesión e intenta otra vez.',
  INVALID_ID_TOKEN: 'Vuelve a iniciar sesión e intenta otra vez.',
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
    if (error.code === 'NETWORK_ERROR') throw new Error('No se pudo conectar con Firebase. Revisa el acceso a Internet del dispositivo e intenta nuevamente.');
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
// Verifica la contraseña actual antes de enviar la nueva exclusivamente a Firebase.
export async function changePassword(currentPassword, newPassword) {
  if (!currentPassword || newPassword.length < 6) throw new Error('Completa la contraseña actual y una nueva de al menos 6 caracteres.');
  if (currentPassword === newPassword) throw new Error('La contraseña nueva debe ser diferente de la actual.');
  const { data: profile } = await api.get('auth/me');
  const version = sessionVersion();
  const credentials = await firebase('signInWithPassword', {
    email: profile.correo, password: currentPassword, returnSecureToken: true,
  });
  if (!credentials.localId || credentials.localId !== profile.firebase_uid) throw new Error('No se pudo comprobar la identidad de tu cuenta.');
  if (sessionVersion() !== version) throw new Error('La sesión cambió. Vuelve a ingresar.');
  const updated = await firebase('update', {
    idToken: credentials.idToken, password: newPassword, returnSecureToken: true,
  });
  if (sessionVersion() !== version) throw new Error('La contraseña se actualizó. Inicia sesión de nuevo.');
  if (!updated.idToken || !updated.refreshToken) {
    clearSession();
    throw new Error('La contraseña se actualizó. Inicia sesión con la nueva contraseña.');
  }
  setSession(updated);
}
export const logout = clearSession;
