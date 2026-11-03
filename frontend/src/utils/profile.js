export function profileForm(user) {
  return {
    nombre_completo: user?.nombre_completo || '',
    telefono: user?.telefono || '',
    fecha_nacimiento: user?.fecha_nacimiento?.slice(0, 10) || '',
  };
}
export function validateProfile(form, today = new Date()) {
  const errors = {};
  if (!form.nombre_completo.trim()) errors.nombre_completo = 'Escribe tu nombre.';
  else if (form.nombre_completo.trim().length > 150) errors.nombre_completo = 'Usa como máximo 150 caracteres.';
  if (form.telefono.trim().length > 20) errors.telefono = 'Usa como máximo 20 caracteres.';
  const value = form.fecha_nacimiento.trim();
  if (value) {
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const date = parts ? new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3])) : null;
    const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (!date || date.getFullYear() !== Number(parts[1]) || date.getMonth() + 1 !== Number(parts[2]) || date.getDate() !== Number(parts[3])) {
      errors.fecha_nacimiento = 'Usa una fecha válida con formato AAAA-MM-DD.';
    } else if (date >= midnight) errors.fecha_nacimiento = 'La fecha debe ser anterior a hoy.';
  }
  return errors;
}
export function profilePayload(form) {
  return {
    nombre_completo: form.nombre_completo.trim(),
    telefono: form.telefono.trim() || null,
    fecha_nacimiento: form.fecha_nacimiento.trim() || null,
  };
}
