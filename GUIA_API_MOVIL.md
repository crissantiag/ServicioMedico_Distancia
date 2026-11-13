# Guía rápida del proyecto móvil

## 1. Preparar el proyecto

Abrir **ServiciosMedicosMovil** en Visual Studio Code. En su terminal, ubicarse donde están package.json e index.js y ejecutar una vez después de descargar el proyecto:

```powershell
npm ci
```

Después, elegir **solo uno** de estos casos:

### A. Voy a usar el emulador de Android Studio

Si el emulador y Laravel se ejecutan en tu computadora, **no necesitas configurar nada más**. El archivo .env incluido ya tiene la dirección correcta. Continúa con **2. Ejecutar y probar**.

Si antes probaste con teléfono y creaste .env.local, cambia su línea a `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api` para volver al emulador.

### B. Voy a usar mi teléfono Android o iPhone con Expo Go

El teléfono necesita conocer la dirección de la computadora donde corre Laravel:

1. Conectar el teléfono y la computadora a la misma red local.
2. En **esa computadora**, abrir CMD o PowerShell y ejecutar:

   ```powershell
   ipconfig
   ```

3. Buscar **Dirección IPv4** en el adaptador que estés usando (Wi-Fi o Ethernet). Por ejemplo: `192.168.1.9`. Esa es la IP de tu computadora; no usar la puerta de enlace.
4. En el explorador de Visual Studio Code, crear el archivo **.env.local** junto a package.json. Si ya existe, abrirlo. Escribir esta línea reemplazando `192.168.1.9` por la IPv4 que encontraste:

   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.9:8000/api
   ```

   La ubicación debe quedar así:

   ```text
   ServiciosMedicosMovil/
     package.json
     .env          ← ya incluido; dejarlo como está
     .env.local    ← aquí va la IP de tu computadora
   ```

5. Guardar el archivo y continuar con **2. Ejecutar y probar**.

No hace falta copiar la clave de Firebase: ya viene configurada en .env. .env.local solo cambia la dirección para tu teléfono y no se sube a GitHub. Si cambia la IP de tu computadora, actualizar esa misma línea.

## 2. Ejecutar y probar

Activar MySQL y tener instalada la base de datos del proyecto. En la carpeta del **backend Laravel compartido** ejecutar:

```powershell
php artisan serve --host=0.0.0.0 --port=8000
```

No ejecutar el backend Node que viene dentro del repositorio móvil.

En otra terminal, desde la raíz de ServiciosMedicosMovil, ejecutar:

```powershell
npx expo start --clear
```

Abrir Expo Go y escanear el QR, o pulsar `a` para abrir el emulador Android. Reiniciar Expo y recargar la app después de cambiar .env.local.

Crear una cuenta o iniciar sesión; después abrir Médicos. Las cuentas nuevas son pacientes.

Si no conecta desde el teléfono, abrir en su navegador `http://IP_DE_TU_PC:8000/api/especialidades`, reemplazando IP_DE_TU_PC. Si responde con JSON, incluso un error de autenticación, existe conexión; si no abre, revisar Laravel, la IP, la red y el permiso del firewall para PHP.

## 3. Consumir endpoints

Desde una pantalla ubicada en frontend/src/screens:

```js
import { api } from '../services/api';

try {
  const { data: medicos, meta } = await api.get('medicos', {
    id_especialidad: 1,
    page: 1,
    per_page: 15,
  });

  const { data: centros } = await api.get('centros-medicos');
  const { data: perfil } = await api.get('auth/me');

  await api.put('auth/me', { telefono: '77777777' });
} catch (error) {
  Alert.alert('No se pudo completar', error.message);
}
```

Para mostrar el aviso, importar Alert desde react-native. `data` contiene los resultados y `meta`, cuando existe, la paginación. DoctorFilterScreen.js es el ejemplo implementado.

- Consultar: `api.get('ruta', filtrosOpcionales)`.
- Crear: `api.post('ruta', datos)`.
- Actualizar: `api.put('ruta', datos)` o `api.patch('ruta', datos)`.
- Eliminar: `api.delete('ruta')`.

Usar las rutas de la colección Postman. Escribirlas sin la dirección del servidor ni el prefijo /api. **El manejador añade el token automáticamente**; las pantallas solo llaman a api y manejan el resultado o el error.

## Historial de citas y ajustes

En Inicio, abrir Historial de citas para ver las citas propias, filtrar por estado, cambiar de página y consultar el detalle. Deslizar hacia abajo actualiza la lista. No es el expediente clínico de diagnósticos.

En Ajustes se editan nombre, teléfono y fecha de nacimiento (AAAA-MM-DD). El correo solo se muestra. Guardar actualiza también el nombre del inicio. Cerrar sesión vuelve al login.

Se reutilizan account.js y api.js; no hay tablas ni paquetes nuevos. El filtro por estado requiere el CitaController actualizado en la API Laravel. Una cuenta nueva sin citas muestra una lista vacía, no datos de otro usuario.

Para probar: entrar, abrir historial, filtrar, ver detalle, volver, editar perfil, guardar, comprobar el nombre al regresar al inicio y cerrar sesión. Si la API no responde, Reintentar vuelve a cargar; los errores al guardar mantienen los datos escritos.

En Ajustes > Cambiar contraseña, escribir la actual, la nueva y su confirmación. El cambio se realiza en Firebase y mantiene la sesión con un token nuevo. No se envían contraseñas al backend Laravel.

### Citas de semilla para revisar el historial

Desde el backend Laravel:

```powershell
php artisan citas:semilla
php artisan citas:semilla tu-correo-registrado@ejemplo.com
```

El primer comando prepara perfiles ficticios del equipo con doce citas cada uno. No crea sus cuentas de Firebase. El segundo agrega doce citas a un perfil que ya inició sesión en esa base, para verlas desde la app. No borra citas existentes y puede repetirse sin duplicar las citas de semilla. No ejecutar migrate:fresh para probar esto.

El historial pide diez citas por página; Anterior y Ver siguientes navegan sin cargar todas las citas de una vez. El contador indica el rango y el total.

## Si aparece un error de conexión al ingresar

- **Firebase:** el dispositivo necesita Internet. No se arregla cambiando usuarios en MySQL.
- **API Laravel:** revisa la dirección que muestra el aviso. En un teléfono físico, Android o iPhone, `.env.local` debe tener la IPv4 de **la computadora que ejecuta Laravel**, con `:8000/api`. `10.0.2.2` sirve para el emulador Android; `localhost` en un teléfono apunta al propio teléfono.
- Desde Safari o Chrome del teléfono abre `http://IP_DE_TU_PC:8000/api/especialidades`. Una respuesta JSON (incluso 401) confirma que llega a Laravel. Si no abre, revisa IP, misma red y que Laravel se ejecute con `--host=0.0.0.0 --port=8000`. Revisa también si PHP tiene permiso para recibir conexiones en la red privada del equipo.
- Después de cambiar `.env.local`, detén Expo y ejecuta `npx expo start --clear`; vuelve a abrir la app. El túnel de Expo solo conecta con Expo, no expone automáticamente Laravel.
- Cada compañero usa su propia IP; la IP de Alex no les sirve si Laravel corre en otra computadora. No vuelvas a registrar ni borres una cuenta para resolver un fallo de red.
