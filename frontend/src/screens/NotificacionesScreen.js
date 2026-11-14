import React, { useCallback, useContext, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { TabPage } from '../components/TabPage';
import { UserContext } from '../context/UserContext';
import { NotificacionesContext } from '../context/NotificacionesContext';
import { notificaciones, rutaDeNotificacion } from '../services/notifications';

const ICONOS = {
  cita_creada: 'calendar-plus',
  cita_reprogramada: 'calendar-clock',
  cita_estado: 'calendar-check',
  recordatorio_cita: 'alarm',
  receta: 'pill',
  chat: 'message-text',
  aviso: 'bullhorn',
};

function cuando(valor) {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toDateString() === new Date().toDateString()
    ? fecha.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    : fecha.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

function Fila({ item, onAbrir, onEliminar }) {
  return <TouchableOpacity activeOpacity={0.8} accessibilityRole="button"
    accessibilityLabel={`${item.leida ? '' : 'Sin leer. '}${item.titulo}. ${item.mensaje}`}
    style={[s.fila, !item.leida && s.filaNueva]} onPress={() => onAbrir(item)}>
    <View style={[s.icono, !item.leida && s.iconoNuevo]}>
      <MaterialCommunityIcons name={ICONOS[item.tipo] || 'bell'} size={24} color={item.leida ? '#5B667D' : '#FFFFFF'} />
    </View>
    <View style={s.cuerpo}>
      <View style={s.titularFila}>
        <Text numberOfLines={1} style={[s.titular, !item.leida && s.titularNuevo]}>{item.titulo}</Text>
        <Text style={s.hora}>{cuando(item.created_at)}</Text>
      </View>
      <Text style={s.mensaje}>{item.mensaje}</Text>
    </View>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Eliminar notificación" hitSlop={10}
      style={s.eliminar} onPress={() => onEliminar(item)}>
      <MaterialCommunityIcons name="close" size={20} color="#8A94A8" />
    </TouchableOpacity>
  </TouchableOpacity>;
}

export default function NotificacionesScreen() {
  const { user } = useContext(UserContext);
  const { refrescar } = useContext(NotificacionesContext);
  const puedeEnviar = user?.rol === 'medico' || user?.rol === 'administrador';
  const [items, setItems] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [ultima, setUltima] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [masCargando, setMasCargando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async (numero = 1) => {
    try {
      const { data, meta } = await notificaciones.listar({ page: numero });
      setItems(actual => numero === 1
        ? data
        : [...actual, ...data.filter(n => !actual.some(a => a.id_notificacion === n.id_notificacion))]);
      setPagina(meta?.current_page ?? numero);
      setUltima(meta?.last_page ?? 1);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
      setRefrescando(false);
      setMasCargando(false);
    }
  }, []);

  // Se actualiza cada vez que la pestaña vuelve a estar visible.
  useFocusEffect(useCallback(() => {
    cargar(1);
    refrescar();
  }, [cargar, refrescar]));

  const abrir = item => {
    if (!item.leida) {
      setItems(actual => actual.map(n => n.id_notificacion === item.id_notificacion ? { ...n, leida: true } : n));
      notificaciones.marcarLeida(item.id_notificacion).then(refrescar).catch(() => {});
    }
    const ruta = rutaDeNotificacion(item.datos);
    if (ruta) router.push(ruta);
  };

  const eliminar = item => {
    setItems(actual => actual.filter(n => n.id_notificacion !== item.id_notificacion));
    notificaciones.eliminar(item.id_notificacion).then(refrescar).catch(() => cargar(1));
  };

  const marcarTodas = () => {
    setItems(actual => actual.map(n => ({ ...n, leida: true })));
    notificaciones.marcarTodas().then(refrescar).catch(() => cargar(1));
  };

  const hayNoLeidas = items.some(n => !n.leida);

  return <TabPage title="Notificaciones">
    <View style={s.barra}>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !hayNoLeidas }}
        disabled={!hayNoLeidas} onPress={marcarTodas} style={[s.accion, !hayNoLeidas && s.accionOff]}>
        <MaterialCommunityIcons name="check-all" size={18} color="#1F2A44" />
        <Text style={s.accionTexto}>Marcar todas como leídas</Text>
      </TouchableOpacity>
      {puedeEnviar && <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/enviar-notificacion')}
        style={[s.accion, s.accionPrincipal]}>
        <MaterialCommunityIcons name="send" size={16} color="#FFFFFF" />
        <Text style={[s.accionTexto, { color: '#FFFFFF' }]}>Enviar aviso</Text>
      </TouchableOpacity>}
    </View>
    {cargando
      ? <ActivityIndicator accessibilityLabel="Cargando" color="#3368A0" style={{ marginTop: 40 }} />
      : <FlatList
        data={items}
        keyExtractor={item => String(item.id_notificacion)}
        renderItem={({ item }) => <Fila item={item} onAbrir={abrir} onEliminar={eliminar} />}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => { setRefrescando(true); cargar(1); }} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (masCargando || pagina >= ultima) return;
          setMasCargando(true);
          cargar(pagina + 1);
        }}
        ListFooterComponent={masCargando ? <ActivityIndicator color="#3368A0" /> : null}
        ListEmptyComponent={<View style={s.vacia} accessibilityRole={error ? 'alert' : undefined}>
          <MaterialCommunityIcons name={error ? 'alert-circle-outline' : 'bell-outline'} size={48} color="#5B667D" />
          <Text style={s.vaciaTitulo}>{error ? 'No se pudieron cargar' : 'Sin notificaciones'}</Text>
          <Text style={s.vaciaTexto}>{error || 'Aquí verás los recordatorios de tus citas y los avisos de tus médicos.'}</Text>
        </View>}
      />}
  </TabPage>;
}

const s = StyleSheet.create({
  barra: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  accion: {
    flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 12,
    borderRadius: 20, backgroundColor: '#FFFFFF',
  },
  accionOff: { opacity: 0.45 },
  accionPrincipal: { backgroundColor: '#3368A0' },
  accionTexto: { fontSize: 14, fontWeight: '600', color: '#1F2A44' },
  fila: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#F2F6FF', borderRadius: 16, padding: 14 },
  filaNueva: { backgroundColor: '#FFFFFF', borderLeftWidth: 4, borderLeftColor: '#3368A0' },
  icono: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#DCE3F2', alignItems: 'center', justifyContent: 'center' },
  iconoNuevo: { backgroundColor: '#3368A0' },
  cuerpo: { flex: 1 },
  titularFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titular: { flex: 1, fontSize: 16, fontWeight: '500', color: '#2F3B52' },
  titularNuevo: { fontWeight: '700' },
  hora: { fontSize: 12, color: '#64748B' },
  mensaje: { fontSize: 14, color: '#5B667D', marginTop: 3, lineHeight: 20 },
  eliminar: { padding: 2 },
  vacia: { backgroundColor: '#F2F6FF', borderRadius: 18, padding: 32, alignItems: 'center', gap: 8 },
  vaciaTitulo: { fontSize: 18, fontWeight: '600', color: '#2F3B52' },
  vaciaTexto: { fontSize: 15, color: '#5B667D', textAlign: 'center' },
});