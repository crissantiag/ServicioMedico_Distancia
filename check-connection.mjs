import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = process.cwd();
const moduleURL = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const read = path => fs.readFileSync(`${root}/${path}`, 'utf8');
const sessionURL = moduleURL(read('frontend/src/services/session.js'));
const session = await import(sessionURL);
const apiURL = moduleURL(read('frontend/src/services/api.js').replace("'./session'", JSON.stringify(sessionURL)));
const { api } = await import(apiURL);
const auth = await import(moduleURL(read('frontend/src/services/auth.js')
    .replace("'./session'", JSON.stringify(sessionURL)).replace("'./api'", JSON.stringify(apiURL))));
process.env.EXPO_PUBLIC_API_URL = 'http://test.local:8000/api';
process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'test-key';
globalThis.fetch = async () => { throw new TypeError('Network request failed'); };
await assert.rejects(auth.login('test@example.test', 'test-pass'), /conectar con Firebase/);
session.setSession({ idToken: 'test', refreshToken: 'test', expiresIn: 3600 });
await assert.rejects(api.get('auth/me'), error => error.code === 'NETWORK_ERROR' && error.message.includes('API Laravel en http://test.local:8000/api'));
assert.equal(await session.getToken(), 'test');
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('HTML instead of JSON'); } });
await assert.rejects(api.get('auth/me'), error => error.code === 'INVALID_RESPONSE' && error.message.includes('JSON'));
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ success: false, message: 'Rechazado' }) });
await assert.rejects(api.get('auth/me'), /Rechazado/);
globalThis.fetch = async url => ({ ok: true, status: 200, json: async () => url.includes('accounts:')
    ? { idToken: 'test', refreshToken: 'test', expiresIn: 3600 }
    : { success: true, data: { id_usuario: 5, rol: 'paciente' } } });
assert.equal((await auth.login('test@example.test', 'test-pass')).rol, 'paciente');
console.log('OK: fallos de Firebase, API inaccesible, respuesta HTML, rechazo de API y login correcto.');
