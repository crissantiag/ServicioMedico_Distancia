import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { fechaReceta, posologia } from './receta';

const esc = value => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// HTML de la receta con el mismo contenido que se ve en pantalla.
export function recetaHtml(receta) {
  const medico = receta.cita?.medico?.nombre_completo || 'Médico no disponible';
  const paciente = receta.usuario?.nombre_completo || 'Paciente no disponible';
  const filas = (receta.detalles || []).map(item => `
    <tr>
      <td><strong>${esc(item.medicamento?.nombre_medicamento || 'Medicamento')}</strong>
        ${item.medicamento?.descripcion_basica ? `<br/><span class="muted">${esc(item.medicamento.descripcion_basica)}</span>` : ''}</td>
      <td>${esc(item.dosis || '-')}</td>
      <td>${esc(item.frecuencia || '-')}</td>
      <td>${esc(item.duracion || '-')}</td>
    </tr>`).join('');
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #1E293B; padding: 32px; }
  h1 { color: #3368A0; font-size: 24px; margin: 0 0 4px; }
  .sub { color: #64748B; font-size: 13px; margin-bottom: 20px; }
  .box { border: 1px solid #66A3BF; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; }
  .row { margin: 4px 0; font-size: 14px; }
  h2 { font-size: 15px; color: #3368A0; margin: 18px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #E6F0FA; color: #24517E; text-align: left; padding: 8px; }
  td { border-bottom: 1px solid #DCE5ED; padding: 8px; vertical-align: top; }
  .muted { color: #64748B; font-size: 12px; }
  .foot { margin-top: 28px; font-size: 12px; color: #64748B; border-top: 1px solid #DCE5ED; padding-top: 10px; }
</style></head><body>
  <h1>Receta médica electrónica</h1>
  <div class="sub">Servicios Médicos a Distancia · Receta N.º ${esc(receta.id_receta)}</div>
  <div class="box">
    <div class="row"><strong>Fecha de emisión:</strong> ${esc(fechaReceta(receta.fecha_emision))}</div>
    <div class="row"><strong>Paciente:</strong> ${esc(paciente)}</div>
    <div class="row"><strong>Médico:</strong> ${esc(medico)}</div>
  </div>
  <h2>Indicaciones generales</h2>
  <div class="row">${esc(receta.indicaciones_generales || 'Sin indicaciones generales')}</div>
  <h2>Medicamentos</h2>
  ${filas ? `<table><tr><th>Medicamento</th><th>Dosis</th><th>Frecuencia</th><th>Duración</th></tr>${filas}</table>`
    : '<div class="row">Sin medicamentos registrados</div>'}
  <div class="foot">Documento generado desde la aplicación. Presenta esta receta en la farmacia.</div>
</body></html>`;
}

// "Descargar": abre el diálogo de impresión de Android, donde se elige "Guardar como PDF".
export async function descargarRecetaPdf(receta) {
  await Print.printAsync({ html: recetaHtml(receta) });
}

// "Compartir": genera el archivo PDF y abre el menú de compartir (WhatsApp, correo, Drive...).
export async function compartirRecetaPdf(receta) {
  const { uri } = await Print.printToFileAsync({ html: recetaHtml(receta) });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Este dispositivo no permite compartir archivos.');
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: `Receta N.º ${receta.id_receta}`,
  });
}