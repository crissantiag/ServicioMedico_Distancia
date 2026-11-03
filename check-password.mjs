import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Buffer } from 'node:buffer';
const url = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const read = path => fs.readFileSync(path, 'utf8');
const sessionURL = url(read('frontend/src/services/session.js'));
const session = await import(sessionURL);
const apiURL = url(read('frontend/src/services/api.js').replace("'./session'", JSON.stringify(sessionURL)));
const { changePassword } = await import(url(read('frontend/src/services/auth.js').replace("'./api'", JSON.stringify(apiURL)).replace("'./session'", JSON.stringify(sessionURL))));
process.env.EXPO_PUBLIC_API_URL = 'http://test.local/api';
process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'public-test-key';
const signIn = () => session.setSession({ idToken: 'original', refreshToken: 'refresh', expiresIn: '3600' });
let calls = [];
let mode = 'success';
globalThis.fetch = async (address, options) => {
  calls.push({ address, options });
  if (address.startsWith('http://test.local')) return { ok: true, status: 200, json: async () => ({ success: true, data: { correo: 'patient@test.local', firebase_uid: 'uid-test' } }) };
  if (address.includes('signInWithPassword')) {
    if (mode === 'wrong-password') return { ok: false, status: 400, json: async () => ({ error: { message: 'INVALID_LOGIN_CREDENTIALS' } }) };
    return { ok: true, status: 200, json: async () => ({ localId: mode === 'wrong-uid' ? 'other-uid' : 'uid-test', idToken: 'recent-token', refreshToken: 'recent-refresh', expiresIn: '3600' }) };
  }
  if (mode === 'logout') session.clearSession();
  return { ok: true, status: 200, json: async () => ({ idToken: 'new-token', refreshToken: 'new-refresh', expiresIn: '3600' }) };
};
signIn();
await changePassword('old-password-test', 'new-password-test');
assert.equal(await session.getToken(), 'new-token');
const change = calls.find(call => call.address.includes('accounts:update'));
assert.deepEqual(JSON.parse(change.options.body), { idToken: 'recent-token', password: 'new-password-test', returnSecureToken: true });
assert.ok(calls.filter(call => call.address.startsWith('http://test.local')).every(call => !call.options.body));
for (const scenario of ['wrong-password', 'wrong-uid']) {
  signIn(); calls = []; mode = scenario;
  await assert.rejects(changePassword('wrong-password-test', 'new-password-test'));
  assert.ok(!calls.some(call => call.address.includes('accounts:update')));
  assert.equal(await session.getToken(), 'original');
}
signIn(); mode = 'logout';
await assert.rejects(changePassword('old-password-test', 'new-password-test'), /se actualizó/);
await assert.rejects(session.getToken(), /Debes iniciar/);
await assert.rejects(changePassword('same-password', 'same-password'), /diferente/);
console.log('OK: contraseña actual, identidad, actualización en Firebase, token nuevo y cierre de sesión sin resurrección.');
