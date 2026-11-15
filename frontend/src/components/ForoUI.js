import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// La API devuelve fechas ISO en UTC; Date las convierte a la hora local del teléfono.
export function fechaForo(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ROLES = { medico: 'Médico', administrador: 'Moderación' };

export function Autor({ usuario, fecha }) {
  const nombre = usuario?.nombre_completo || 'Usuario';
  const rol = ROLES[usuario?.rol];
  return <View style={s.autor}>
    <View style={s.avatar}><Text style={s.inicial}>{nombre.trim().charAt(0).toUpperCase()}</Text></View>
    <View style={s.autorTexto}>
      <View style={s.nombreFila}>
        <Text style={s.nombre} numberOfLines={1}>{nombre}</Text>
        {rol ? <Text style={s.chip}>{rol}</Text> : null}
      </View>
      <Text style={s.fecha}>{fechaForo(fecha)}</Text>
    </View>
  </View>;
}

export function Metricas({ apoyos = 0, comentarios = 0 }) {
  return <View style={s.metricas}>
    <View style={s.metrica}>
      <MaterialCommunityIcons name="heart-outline" size={18} color="#64748B" />
      <Text style={s.metricaTexto}>{apoyos}</Text>
    </View>
    <View style={s.metrica}>
      <MaterialCommunityIcons name="comment-outline" size={18} color="#64748B" />
      <Text style={s.metricaTexto}>{comentarios}</Text>
    </View>
  </View>;
}

export function ApoyoBoton({ apoyado, total, onPress, disabled }) {
  return <TouchableOpacity accessibilityRole="button" disabled={disabled}
    accessibilityLabel={apoyado ? 'Quitar mi apoyo' : 'Enviar apoyo'}
    accessibilityState={{ selected: !!apoyado, disabled: !!disabled }}
    onPress={onPress} style={[s.apoyo, apoyado && s.apoyoActivo, disabled && s.deshabilitado]}>
    <MaterialCommunityIcons name={apoyado ? 'heart' : 'heart-outline'} size={20} color={apoyado ? '#fff' : '#24517E'} />
    <Text style={[s.apoyoTexto, apoyado && s.apoyoTextoActivo]}>{apoyado ? 'Apoyaste' : 'Me apoya'} · {total}</Text>
  </TouchableOpacity>;
}

const s = StyleSheet.create({
  autor: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E6F0FA', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  inicial: { color: '#3368A0', fontWeight: 'bold', fontSize: 17 },
  autorTexto: { flex: 1 },
  nombreFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nombre: { flexShrink: 1, color: '#1E293B', fontWeight: 'bold', fontSize: 15 },
  chip: { backgroundColor: '#3368A0', color: '#fff', fontSize: 11, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  fecha: { color: '#64748B', fontSize: 12 },
  metricas: { flexDirection: 'row', gap: 18, marginBottom: 4 },
  metrica: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metricaTexto: { color: '#64748B', fontSize: 14 },
  apoyo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, borderRadius: 10, backgroundColor: '#E6F0FA', padding: 12, marginTop: 8 },
  apoyoActivo: { backgroundColor: '#3368A0' },
  apoyoTexto: { color: '#24517E', fontWeight: 'bold', fontSize: 15 },
  apoyoTextoActivo: { color: '#fff' },
  deshabilitado: { opacity: 0.45 },
});
