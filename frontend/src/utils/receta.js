export function fechaReceta(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  if (!match) return 'Fecha no disponible';
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' });
}

export const posologia = d => [d.dosis, d.frecuencia, d.duracion].filter(Boolean).join(' · ');