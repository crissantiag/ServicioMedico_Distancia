import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Buffer } from 'node:buffer';
import { createRequire } from 'node:module';

const read = path => fs.readFileSync(path, 'utf8');
const moduleURL = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const sessionURL = moduleURL(read('frontend/src/services/session.js'));
const session = await import(sessionURL);
const apiURL = moduleURL(read('frontend/src/services/api.js').replace("'./session'", JSON.stringify(sessionURL)));
const { medicosAdmin, medicoForm, medicoPayload, validateMedico } = await import(moduleURL(
  read('frontend/src/services/medicosAdmin.js').replace("'./api'", JSON.stringify(apiURL)),
));
process.env.EXPO_PUBLIC_API_URL = 'http://test.local/api';
session.setSession({ idToken: 'admin-token', refreshToken: 'test-refresh', expiresIn: 3600 });
const form = medicoForm({ nombre_completo: ' Dra. Rivera ', id_especialidad: 2, idioma: ' Español ', disponibilidad: ' ' });
assert.deepEqual(validateMedico(form), {});
assert.deepEqual(medicoPayload(form), { nombre_completo: 'Dra. Rivera', id_especialidad: 2, idioma: 'Español', centros: [], disponibilidad: null });
assert.deepEqual(Object.keys(validateMedico(medicoForm())).sort(), ['id_especialidad', 'nombre_completo']);
assert.equal(medicoPayload(medicoForm()).idioma, 'Español');
const existing = medicoForm({ idioma: 'Inglés', centros: [{ id_centro: 3 }, { id_centro: 4 }] });
assert.equal(medicoPayload(existing).idioma, 'Inglés');
assert.deepEqual(medicoPayload(existing).centros, [3, 4]);
assert.deepEqual(medicoPayload({ ...existing, centros: ['3', '3'] }).centros, [3]);
assert.ok(validateMedico({ ...form, centros: ['../3'] }).centros);
assert.ok(validateMedico({ ...form, nombre_completo: 'a'.repeat(151) }).nombre_completo);
assert.ok(validateMedico({ ...form, disponibilidad: 'a'.repeat(256) }).disponibilidad);
assert.throws(() => medicosAdmin.detail('../usuarios'), /no es válido/);
assert.throws(() => medicosAdmin.update(0, {}), /no es válido/);
assert.throws(() => medicosAdmin.remove('1/2'), /no es válido/);
const requests = [];
globalThis.fetch = async (url, options) => {
  requests.push({ url, options });
  return { ok: true, status: 200, json: async () => ({ success: true, data: { id_medico: 7 }, meta: {} }) };
};
await medicosAdmin.list(2);
await medicosAdmin.detail(7);
await medicosAdmin.create(medicoPayload(form));
await medicosAdmin.update(7, medicoPayload(form));
await medicosAdmin.remove(7);
assert.ok(requests.every(r => r.options.headers.Authorization === 'Bearer admin-token'));
assert.ok(requests[0].url.includes('page=2') && requests[0].url.includes('per_page=10'));
assert.ok(requests[1].url.endsWith('/admin/medicos/7'));
assert.deepEqual(requests.map(r => r.options.method), ['GET', 'GET', 'POST', 'PUT', 'DELETE']);
assert.equal(JSON.parse(requests[3].options.body).disponibilidad, null);
assert.ok(!('id_usuario' in JSON.parse(requests[3].options.body))); // Conservar la cuenta ya vinculada.
let pages = 0;
globalThis.fetch = async url => {
  pages += 1;
  assert.ok(url.includes(`page=${pages}`) && url.includes('per_page=100'));
  return { ok: true, status: 200, json: async () => ({ success: true, data: [{ id_especialidad: pages }], meta: { last_page: 2 } }) };
};
assert.deepEqual(await medicosAdmin.specialties(), [{ id_especialidad: 1 }, { id_especialidad: 2 }]);
pages = 0;
globalThis.fetch = async url => {
  pages += 1;
  assert.ok(url.includes('/admin/centros-medicos') && url.includes(`page=${pages}`));
  return { ok: true, status: 200, json: async () => ({ success: true, data: [{ id_centro: pages }], meta: { last_page: 2 } }) };
};
assert.deepEqual(await medicosAdmin.centers(), [{ id_centro: 1 }, { id_centro: 2 }]);
globalThis.fetch = async () => ({ ok: false, status: 422, json: async () => ({ errors: { nombre_completo: ['Inválido'] } }) });
await assert.rejects(medicosAdmin.create({}), error => error.status === 422 && error.errors.nombre_completo[0] === 'Inválido');
globalThis.fetch = async () => ({ ok: false, status: 409, json: async () => ({ message: 'Tiene citas relacionadas' }) });
await assert.rejects(medicosAdmin.remove(7), error => error.status === 409 && error.message.includes('relacionadas'));
globalThis.fetch = async () => ({ ok: false, status: 403, json: async () => ({ message: 'Solo administradores' }) });
await assert.rejects(medicosAdmin.list(), error => error.status === 403);
assert.equal(await session.getToken(), 'admin-token');
const parser = createRequire(import.meta.url)('@babel/parser');
for (const file of ['src/app/_layout.js', 'src/app/admin-medicos/index.js', 'src/app/admin-medicos/crear.js', 'src/app/admin-medicos/[id].js',
  'frontend/src/screens/MedicosAdminScreen.js', 'frontend/src/screens/MedicoAdminFormScreen.js', 'frontend/src/components/MedicosAdminAccess.js']) {
  parser.parse(read(file), { sourceType: 'module', plugins: ['jsx'] });
}
console.log('OK: CRUD con token, paginación, catálogos completos, validaciones, cuenta vinculada, 422/409/403 y sintaxis de rutas.');
