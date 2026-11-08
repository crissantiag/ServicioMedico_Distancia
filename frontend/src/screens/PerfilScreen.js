import React, { useContext } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { UserContext } from '../context/UserContext';
import { TabPage } from '../components/TabPage';
import { fechaNacimiento } from '../utils/cita';

const ROLES = { paciente: 'Paciente', medico: 'Médico', administrador: 'Administrador' };

const iniciales = nombre => String(nombre || '?').trim().split(/\s+/).slice(0, 2)
  .map(p => p[0]?.toUpperCase() || '').join('') || '?';

function Dato({ icono, etiqueta, valor }) {
  return <View style={s.dato}>
    <View style={s.datoIcono}><MaterialCommunityIcons name={icono} size={22} color="#3368A0" /></View>
    <View style={{ flex: 1 }}>
      <Text style={s.etiqueta}>{etiqueta}</Text>
      <Text selectable style={s.valor}>{valor}</Text>
    </View>
  </View>;
}

function Opcion({ icono, texto, onPress, peligro = false }) {
  return <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={s.opcion} onPress={onPress}>
    <MaterialCommunityIcons name={icono} size={24} color={peligro ? '#B42318' : '#3368A0'} />
    <Text style={[s.opcionTexto, peligro && { color: '#B42318' }]}>{texto}</Text>
    {peligro ? null : <MaterialCommunityIcons name="chevron-right" size={24} color="#5B667D" />}
  </TouchableOpacity>;
}

export default function PerfilScreen() {
  const { user, signOut } = useContext(UserContext);
  const confirmarSalida = () => Alert.alert('Cerrar sesión', '¿Quieres salir de tu cuenta?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Salir', style: 'destructive', onPress: signOut },
  ]);
  return <TabPage title="Perfil">
    <ScrollView contentContainerStyle={s.contenido}>
      <View style={s.portada}>
        <View style={s.avatar}><Text style={s.iniciales}>{iniciales(user?.nombre_completo)}</Text></View>
        <Text style={s.nombre}>{user?.nombre_completo || 'Usuario'}</Text>
        <View style={s.rol}><Text style={s.rolTexto}>{ROLES[user?.rol] || 'Usuario'}</Text></View>
      </View>

      <View style={s.tarjeta}>
        <Dato icono="email-outline" etiqueta="Correo electrónico" valor={user?.correo || 'No registrado'} />
        <Dato icono="phone-outline" etiqueta="Teléfono" valor={user?.telefono || 'No registrado'} />
        <Dato icono="cake-variant-outline" etiqueta="Fecha de nacimiento" valor={fechaNacimiento(user?.fecha_nacimiento)} />
      </View>

      <View style={s.tarjeta}>
        <Opcion icono="pill" texto="Mis recetas" onPress={() => router.push('/recetas')} />
        <Opcion icono="account-edit-outline" texto="Editar mis datos y contraseña" onPress={() => router.push('/ajustes')} />
        <Opcion icono="logout" texto="Cerrar sesión" peligro onPress={confirmarSalida} />
      </View>
    </ScrollView>
  </TabPage>;
}

const s = StyleSheet.create({
  contenido: { padding: 16, paddingBottom: 30 },
  portada: { alignItems: 'center', marginVertical: 14 },
  avatar: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#1F2A44',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  iniciales: { fontSize: 34, fontWeight: 'bold', color: '#FFFFFF' },
  nombre: { fontSize: 22, fontWeight: '600', color: '#2F3B52', textAlign: 'center' },
  rol: { backgroundColor: '#E3E8F2', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 14, marginTop: 8 },
  rolTexto: { fontSize: 14, fontWeight: '600', color: '#5B667D' },
  tarjeta: { backgroundColor: '#F2F6FF', borderRadius: 18, padding: 16, marginBottom: 14 },
  dato: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  datoIcono: {
    width: 42, height: 42, borderRadius: 10, backgroundColor: '#E6F0FA',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  etiqueta: { fontSize: 13, color: '#5B667D' },
  valor: { fontSize: 16, color: '#2F3B52' },
  opcion: { flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: 14 },
  opcionTexto: { flex: 1, fontSize: 16, color: '#2F3B52' },
});