import React, { useContext, useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { UserContext } from '../context/UserContext';
import { account } from '../services/account';
import { useResource } from '../hooks/useResource';
import { Feedback } from '../components/AccountUI';
import { diasHasta, etiquetaDias, fechaCita, mayuscula, partesCita } from '../utils/cita';

// Franja y distintivo de cada tarjeta según el estado (nombres de la tabla estados_cita).
const ESTADOS = {
  Completada: { franja: '#16A34A', fondo: '#DCFCE7', texto: '#166534' },
  Confirmada: { franja: '#2563EB', fondo: '#DBEAFE', texto: '#1E40AF' },
  Pendiente: { franja: '#F59E0B', fondo: '#FEF3C7', texto: '#92400E' },
  Cancelada: { franja: '#DC2626', fondo: '#FEE2E2', texto: '#991B1B' },
};
const ESTADO_BASE = { franja: '#64748B', fondo: '#E2E8F0', texto: '#334155' };

const quien = (cita, esMedico) => esMedico
  ? cita.usuario?.nombre_completo || 'Paciente no disponible'
  : cita.medico?.nombre_completo || 'Médico no disponible';

function CitaDestacada({ cita, esMedico }) {
  const fecha = cita._fecha;
  const partes = partesCita(cita.fecha_hora);
  const estado = cita.estado?.nombre_estado || 'Sin estado';
  return <View style={s.destacada}>
    <View style={s.destacadaTop}>
      <Text style={s.destacadaEtiqueta}>PRÓXIMA CITA</Text>
      <View style={s.cuenta}><Text style={s.cuentaTexto}>{etiquetaDias(diasHasta(fecha))}</Text></View>
    </View>
    <Text style={s.destacadaHora}>{partes?.hora}</Text>
    <Text style={s.destacadaFecha}>
      {mayuscula(fecha.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }))}
    </Text>
    <View style={s.destacadaLinea} />
    <View style={s.destacadaPersona}>
      <MaterialCommunityIcons name={esMedico ? 'account' : 'doctor'} size={30} color="#FFFFFF" />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={s.destacadaNombre}>{quien(cita, esMedico)}</Text>
        <Text style={s.destacadaSub}>
          {cita.medico?.especialidad?.nombre_especialidad || 'Sin especialidad'} · {estado}
        </Text>
      </View>
    </View>
    <TouchableOpacity accessibilityRole="button" activeOpacity={0.85} style={s.destacadaBoton}
      onPress={() => router.push(`/citas/${cita.id_cita}`)}>
      <Text style={s.destacadaBotonTexto}>Ver detalle</Text>
    </TouchableOpacity>
  </View>;
}

function FilaCita({ cita, esMedico }) {
  const estado = cita.estado?.nombre_estado || 'Sin estado';
  const color = ESTADOS[estado] || ESTADO_BASE;
  const partes = partesCita(cita.fecha_hora);
  const [hora, ampm] = (partes?.hora || '--:-- --').split(' ');
  return <TouchableOpacity activeOpacity={0.8} accessibilityRole="button"
    accessibilityLabel={`Cita ${estado} del ${partes?.dia} de ${partes?.mes}, ver detalle`}
    style={[s.fila, { borderLeftColor: color.franja }]} onPress={() => router.push(`/citas/${cita.id_cita}`)}>
    <View style={s.cuando}>
      <Text style={s.cuandoDia}>{partes?.dia} {partes?.mes}</Text>
      <Text style={s.cuandoHora}>{hora}</Text>
      <Text style={s.cuandoAmpm}>{ampm}</Text>
    </View>
    <View style={s.detalle}>
      <Text numberOfLines={1} style={s.especialidad}>
        {cita.medico?.especialidad?.nombre_especialidad || 'Sin especialidad'}
      </Text>
      <Text numberOfLines={1} style={s.persona}>{quien(cita, esMedico)}</Text>
      <View style={s.motivoFila}>
        <MaterialCommunityIcons name="text-box-outline" size={16} color="#64748B" />
        <Text numberOfLines={1} style={s.motivo}>{cita.motivo_consulta || 'Sin motivo registrado'}</Text>
      </View>
      <View style={[s.pill, { backgroundColor: color.fondo }]}>
        <Text style={[s.pillTexto, { color: color.texto }]}>{estado}</Text>
      </View>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={24} color="#94A3B8" />
  </TouchableOpacity>;
}

export default function MisCitasScreen() {
  const { user } = useContext(UserContext);
  const esMedico = user?.rol === 'medico';
  const [segmento, setSegmento] = useState('proximas');
  const agenda = useResource(account.agenda);

  const { proximas, anteriores } = useMemo(() => {
    const ahora = new Date();
    const citas = (agenda.data?.data || [])
      .map(c => ({ ...c, _fecha: fechaCita(c.fecha_hora) }))
      .filter(c => c._fecha);
    const cancelada = c => c.estado?.nombre_estado === 'Cancelada';
    return {
      proximas: citas.filter(c => !cancelada(c) && c._fecha >= ahora).sort((a, b) => a._fecha - b._fecha),
      anteriores: citas.filter(c => cancelada(c) || c._fecha < ahora).sort((a, b) => b._fecha - a._fecha),
    };
  }, [agenda.data]);

  const destacada = segmento === 'proximas' ? proximas[0] : null;
  const lista = useMemo(() => (segmento === 'proximas' ? proximas.slice(1) : anteriores), [segmento, proximas, anteriores]);

  // Agrupa por mes: "Noviembre 2026"
  const secciones = useMemo(() => {
    const grupos = [];
    lista.forEach(c => {
      const titulo = mayuscula(c._fecha.toLocaleDateString('es', { month: 'long', year: 'numeric' }));
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && ultimo.title === titulo) ultimo.data.push(c);
      else grupos.push({ title: titulo, data: [c] });
    });
    return grupos;
  }, [lista]);

  const vacio = !agenda.loading && !agenda.error && !destacada && secciones.length === 0;

  return <SafeAreaView style={s.page} edges={['top']}>
    <SectionList
      sections={secciones}
      keyExtractor={item => String(item.id_cita)}
      contentContainerStyle={s.contenido}
      refreshing={agenda.loading}
      onRefresh={agenda.reload}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={<View>
        <Text style={s.titulo}>Mis citas</Text>
        <Text style={s.resumen}>
          {proximas.length} {proximas.length === 1 ? 'próxima' : 'próximas'} · {anteriores.length} {anteriores.length === 1 ? 'anterior' : 'anteriores'}
        </Text>

        <View style={s.segmentos} accessibilityRole="tablist">
          {[['proximas', 'Próximas', proximas.length], ['anteriores', 'Anteriores', anteriores.length]].map(([clave, texto, total]) =>
            <TouchableOpacity key={clave} accessibilityRole="tab" accessibilityState={{ selected: segmento === clave }}
              activeOpacity={0.8} style={[s.segmento, segmento === clave && s.segmentoActivo]} onPress={() => setSegmento(clave)}>
              <Text style={[s.segmentoTexto, segmento === clave && s.segmentoTextoActivo]}>{texto} ({total})</Text>
            </TouchableOpacity>)}
        </View>

        <Feedback loading={agenda.loading && !agenda.data} error={agenda.error} retry={agenda.reload} />
        {destacada ? <CitaDestacada cita={destacada} esMedico={esMedico} /> : null}
      </View>}
      renderSectionHeader={({ section }) => <Text style={s.mes}>{section.title}</Text>}
      renderItem={({ item }) => <FilaCita cita={item} esMedico={esMedico} />}
      ListEmptyComponent={vacio ? <View style={s.vacio}>
        <MaterialCommunityIcons name="calendar-blank-outline" size={46} color="#66A3BF" />
        <Text style={s.vacioTitulo}>
          {segmento === 'proximas' ? 'No tienes citas próximas' : 'Aún no hay citas anteriores'}
        </Text>
        <Text style={s.vacioTexto}>
          {segmento === 'proximas' ? 'Agenda una desde el Inicio cuando la necesites.' : 'Tus citas pasadas y canceladas aparecerán aquí.'}
        </Text>
      </View> : null}
    />
  </SafeAreaView>;
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F2EFE7' },
  contenido: { padding: 20, paddingBottom: 30 },
  titulo: { fontSize: 30, fontWeight: 'bold', color: '#1E293B' },
  resumen: { fontSize: 15, color: '#64748B', marginTop: 2, marginBottom: 16 },
  segmentos: { flexDirection: 'row', backgroundColor: '#E6F0FA', borderRadius: 14, padding: 4, marginBottom: 18 },
  segmento: { flex: 1, minHeight: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segmentoActivo: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#3368A0', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 2,
  },
  segmentoTexto: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  segmentoTextoActivo: { color: '#3368A0' },

  destacada: { backgroundColor: '#3368A0', borderRadius: 22, padding: 20, marginBottom: 8 },
  destacadaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  destacadaEtiqueta: { color: '#CFE3F5', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.2 },
  cuenta: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 12 },
  cuentaTexto: { color: '#3368A0', fontWeight: 'bold', fontSize: 14 },
  destacadaHora: { color: '#FFFFFF', fontSize: 44, fontWeight: 'bold', marginTop: 10 },
  destacadaFecha: { color: '#E6F0FA', fontSize: 17 },
  destacadaLinea: { height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 16 },
  destacadaPersona: { flexDirection: 'row', alignItems: 'center' },
  destacadaNombre: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  destacadaSub: { color: '#CFE3F5', fontSize: 14, marginTop: 2 },
  destacadaBoton: { backgroundColor: '#FFFFFF', borderRadius: 12, minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  destacadaBotonTexto: { color: '#3368A0', fontWeight: 'bold', fontSize: 15 },

  mes: { fontSize: 14, fontWeight: 'bold', color: '#3368A0', marginTop: 18, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  fila: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16,
    borderLeftWidth: 6, padding: 14, marginBottom: 10,
    shadowColor: '#3368A0', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 5, elevation: 2,
  },
  cuando: { width: 72, alignItems: 'center', marginRight: 12 },
  cuandoDia: { fontSize: 13, fontWeight: 'bold', color: '#3368A0', textTransform: 'uppercase' },
  cuandoHora: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginTop: 2 },
  cuandoAmpm: { fontSize: 12, color: '#64748B' },
  detalle: { flex: 1 },
  especialidad: { fontSize: 17, fontWeight: 'bold', color: '#1E293B' },
  persona: { fontSize: 14, color: '#334155', marginTop: 1 },
  motivoFila: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  motivo: { flex: 1, fontSize: 13, color: '#64748B' },
  pill: { alignSelf: 'flex-start', borderRadius: 8, paddingVertical: 2, paddingHorizontal: 9, marginTop: 8 },
  pillTexto: { fontSize: 12, fontWeight: 'bold' },

  vacio: { alignItems: 'center', padding: 30, gap: 8 },
  vacioTitulo: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  vacioTexto: { fontSize: 15, color: '#64748B', textAlign: 'center' },
});