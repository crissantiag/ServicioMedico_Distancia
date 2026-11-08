const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// fecha_hora llega como "2026-11-07T11:30:00.000000Z". La hora de la cita es la hora de
// reloj guardada (11:30), así que se lee del texto y NO se convierte a la zona del teléfono.
export function partesCita(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(value || ''));
  if (!m) return null;
  const h = Number(m[4]);
  return {
    dia: m[3],
    mes: MESES[Number(m[2]) - 1],
    hora: `${String(h % 12 || 12).padStart(2, '0')}:${m[5]} ${h < 12 ? 'AM' : 'PM'}`,
  };
}

// fecha_nacimiento ("1998-04-12" o con hora) -> "12 de abril de 1998"
export function fechaNacimiento(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  if (!m) return 'No registrada';
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    .toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Fecha de la cita como Date con la hora de reloj guardada (sin conversión de zona).
export function fechaCita(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(value || ''));
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5])) : null;
}

// Días de calendario que faltan desde hoy hasta la fecha (0 = hoy, 1 = mañana).
export function diasHasta(fecha, ahora = new Date()) {
  const a = Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const b = Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  return Math.round((a - b) / 86400000);
}

export const etiquetaDias = n => (n < 0 ? 'Pasada' : n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : `En ${n} días`);
export const mayuscula = texto => texto.charAt(0).toUpperCase() + texto.slice(1);