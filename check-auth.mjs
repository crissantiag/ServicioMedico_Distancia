import fs from 'node:fs';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
const sessionSource = fs.readFileSync('frontend/src/services/session.js', 'utf8');
const sessionURL = 'data:text/javascript;base64,' + Buffer.from(sessionSource).toString('base64');
const session = await import(sessionURL);
const apiSource = fs.readFileSync('frontend/src/services/api.js', 'utf8').replace("'./session'", JSON.stringify(sessionURL));
const { api } = await import('data:text/javascript;base64,' + Buffer.from(apiSource).toString('base64'));
process.env.EXPO_PUBLIC_API_URL = 'http://test.local/api';
process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'test';
let calls = [];
globalThis.fetch = async (url, options) => {
 calls.push({url, options});
 return {ok:true,status:200,json:async()=> url.includes('securetoken') ? {id_token:'renewed',refresh_token:'refresh2',expires_in:'3600'} : {success:true,data:[]}};
};
session.setSession({idToken:'first',refreshToken:'refresh',expiresIn:3600});
await api.get('medicos',{idioma:'Español',id_centro:''});
assert.equal(calls[0].options.headers.Authorization,'Bearer first');
assert.ok(calls[0].url.includes('idioma=Espa%C3%B1ol'));
assert.ok(!calls[0].url.includes('id_centro'));
session.setSession({idToken:'expired',refreshToken:'refresh',expiresIn:0});
calls=[];
await Promise.all([api.get('medicos'),api.get('centros-medicos')]);
assert.equal(calls.filter(c=>c.url.includes('securetoken')).length,1);
assert.ok(calls.filter(c=>!c.url.includes('securetoken')).every(c=>c.options.headers.Authorization==='Bearer renewed'));
let loggedOut=false;session.subscribeLogout(()=>{loggedOut=true;});
globalThis.fetch=async()=>({ok:false,status:401,json:async()=>({message:'Unauthorized'})});
await assert.rejects(api.get('medicos'),/Vuelve a ingresar/);
assert.equal(loggedOut,true);
await assert.rejects(session.getToken(),/Debes iniciar/);
session.setSession({idToken:'valid',refreshToken:'r',expiresIn:3600});
globalThis.fetch=async()=>({ok:false,status:422,json:async()=>({message:'Revisa datos',errors:{telefono:['Inválido']}})});
await assert.rejects(api.put('auth/me',{telefono:'x'}),error=>error.status===422 && !!error.errors.telefono);
assert.equal(await session.getToken(),'valid');
await assert.rejects(api.get('https://other.example'),/ruta relativa/);
console.log('OK: Bearer, filtros, renovación concurrente, 401/logout, validaciones y restricción de URL.');
const {createRequire}=await import('node:module');const require=createRequire(import.meta.url);
const parser=require('@babel/parser');
for (const path of ['App.js','frontend/src/context/UserContext.js','frontend/src/screens/LoginScreen.js','frontend/src/screens/RegisterScreen.js','frontend/src/screens/HomeScreen.js','frontend/src/screens/DoctorFilterScreen.js']) {
 parser.parse(fs.readFileSync(path,'utf8'),{sourceType:'module',plugins:['jsx']});
}
console.log('OK: sintaxis JSX de las pantallas y contexto.');

const authSource = fs.readFileSync('frontend/src/services/auth.js','utf8')
 .replace("'./api'",JSON.stringify('data:text/javascript;base64,'+Buffer.from(apiSource).toString('base64')))
 .replace("'./session'",JSON.stringify(sessionURL));
const auth=await import('data:text/javascript;base64,'+Buffer.from(authSource).toString('base64'));
let requests=[];
globalThis.fetch=async(url,options)=>{
 requests.push({url,options});
 const data=url.includes('accounts:') ? {idToken:'firebase-login',refreshToken:'r',expiresIn:'3600'} :
 {success:true,data:{nombre_completo:'Paciente prueba',rol:'paciente'}};
 return {ok:true,status:200,json:async()=>data};
};
assert.equal((await auth.login('paciente@test.local','not-a-real-password')).rol,'paciente');
assert.ok(requests.some(r=>r.url.endsWith('/auth/me')&&r.options.headers.Authorization==='Bearer firebase-login'));
requests=[];
await auth.register('Paciente prueba','paciente@test.local','not-a-real-password');
assert.ok(requests.some(r=>r.url.includes('accounts:signUp')));
assert.ok(requests.some(r=>r.options.method==='PUT'&&JSON.parse(r.options.body).nombre_completo==='Paciente prueba'));
assert.ok(requests.every(r=>!r.options.body||!r.url.startsWith('http://test.local')||!r.options.body.includes('not-a-real-password')));
auth.logout();await assert.rejects(session.getToken(),/Debes iniciar/);
console.log('OK: login, registro y perfil con respuestas simuladas; la contraseña nunca se envía a Laravel.');
