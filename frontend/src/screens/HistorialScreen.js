import React, { useCallback, useContext, useRef, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { UserContext } from '../context/UserContext';
import { account, HISTORY_PAGE_SIZE } from '../services/account';
import { useResource } from '../hooks/useResource';
import { AccountPage, Action, Feedback, appointmentDate, styles } from '../components/AccountUI';

export default function HistorialScreen() {
  const { user } = useContext(UserContext);
  const list = useRef(null);
  const [state, setState] = useState('');
  const [tabSeccion, setTabSeccion] = useState('consultas'); // 'consultas' | 'recetas' | 'pruebas'
  const [page, setPage] = useState(1);

  const esMedico = user?.rol === 'medico';

  const load = useCallback(
    () => account.appointments(user?.id_usuario, { state, page, role: esMedico ? 'medico' : 'paciente' }),
    [user?.id_usuario, esMedico, state, page]
  );

  const history = useResource(load);
  const states = useResource(account.states);
  const meta = history.data?.meta;

  const changePage = next => {
    setPage(next);
    list.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // Filtrar items según la pestaña del Historial Médico Digital
  const citasBrutas = history.data?.data || [];
  const itemsFiltrados = citasBrutas.filter(item => {
    if (tabSeccion === 'recetas') return Boolean(item.receta);
    if (tabSeccion === 'pruebas') {
    return Boolean(item.historial?.length > 0 && item.historial[0]?.observaciones?.includes('Resultados de pruebas:'));
  }
    return true; // 'consultas' muestra todo el registro de consultas
  });

  const first = meta?.total ? (meta.current_page - 1) * meta.per_page + 1 : 0;
  const last = meta ? Math.min(meta.current_page * meta.per_page, meta.total) : 0;

  return (
    <AccountPage title={esMedico ? 'Historial Clínico y Pacientes' : 'Historial Médico Digital'}>
      <FlatList
        ref={list}
        contentContainerStyle={styles.content}
        data={itemsFiltrados}
        keyExtractor={item => String(item.id_cita)}
        refreshing={history.loading}
        onRefresh={history.reload}
        ListHeaderComponent={
          <>
            <Text style={styles.muted}>
              {esMedico
                ? 'Gestiona las consultas de tus pacientes, emite recetas y registra resultados de pruebas.'
                : 'Accede a tu registro de consultas, recetas electrónicas y resultados de pruebas.'}
            </Text>

            {/* Botón de acceso directo a Gráficas Médicas */}
            <TouchableOpacity
              onPress={() => router.push('/estadisticas')}
              style={{
                backgroundColor: '#3368A0',
                padding: 12,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginVertical: 10,
              }}
            >
              <MaterialCommunityIcons name="chart-bar" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>
                Ver Gráficas de Pacientes y Medicamentos
              </Text>
            </TouchableOpacity>

            {/* Pestañas del Historial Médico Digital */}
            <View style={{ flexDirection: 'row', gap: 6, marginVertical: 8 }}>
              {[
                { key: 'consultas', label: 'Consultas' },
                { key: 'recetas', label: 'Recetas' },
                { key: 'pruebas', label: 'Resultados Pruebas' },
              ].map(tab => {
                const activo = tabSeccion === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setTabSeccion(tab.key)}
                    style={{
                      flex: 1,
                      paddingVertical: 9,
                      borderRadius: 8,
                      alignItems: 'center',
                      backgroundColor: activo ? '#24517E' : '#E2E8F0',
                    }}
                  >
                    <Text style={{ color: activo ? '#FFF' : '#334155', fontWeight: 'bold', fontSize: 12 }}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Estado de la cita</Text>
            <View style={[styles.input, { paddingHorizontal: 0 }]}>
              <Picker
                accessibilityLabel="Filtrar citas por estado"
                selectedValue={state}
                onValueChange={value => {
                  setState(value);
                  setPage(1);
                }}
              >
                <Picker.Item label="Todos los estados" value="" />
                {(states.data?.data || []).map(item => (
                  <Picker.Item key={item.id_estado} label={item.nombre_estado} value={String(item.id_estado)} />
                ))}
              </Picker>
            </View>

            <Feedback loading={false} error={states.error} retry={states.reload} />
            {meta ? (
              <Text style={styles.text}>
                Mostrando {first}–{last} de {meta.total} registros
              </Text>
            ) : null}
            <Feedback loading={history.loading} error={history.error} retry={history.reload} />
          </>
        }
        renderItem={({ item }) => {
          const registroClinico = item.historial?.[0];
          return (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.badge}>{item.estado?.nombre_estado || 'Estado no disponible'}</Text>
                {item.receta ? (
                  <Text style={[styles.badge, { backgroundColor: '#DCFCE7', color: '#166534' }]}>Con Receta</Text>
                ) : null}
              </View>

              {/* Muestra el PACIENTE si el usuario logueado es Médico, o el MÉDICO si es Paciente */}
              <Text style={styles.title}>
                {esMedico
                  ? `Paciente: ${item.usuario?.nombre_completo || 'Paciente no disponible'}`
                  : item.medico?.nombre_completo || 'Médico no disponible'}
              </Text>

              <Text style={styles.text}>
                {item.medico?.especialidad?.nombre_especialidad || 'Consulta General'}
              </Text>
              <Text style={styles.text}>{appointmentDate(item.fecha_hora)}</Text>
              <Text style={styles.text} numberOfLines={2}>
                Motivo: {item.motivo_consulta || 'Sin motivo registrado'}
              </Text>

              {/* Resumen según pestaña */}
              {tabSeccion === 'recetas' && item.receta ? (
                <Text style={[styles.text, { color: '#24517E', fontWeight: '600', marginTop: 4 }]}>
                  💊 {item.receta.indicaciones_generales || 'Receta electrónica emitida'}
                </Text>
              ) : null}


              {tabSeccion === 'pruebas' && registroClinico?.observaciones ? (
                <Text style={[styles.text, { color: '#0F766E', fontWeight: '600', marginTop: 4 }]}>
                  🧪 {registroClinico.observaciones}
                </Text>
              ) : null}

              <Action secondary onPress={() => router.push(`/citas/${item.id_cita}`)}>
                {esMedico ? 'Atender / Ver Expediente' : 'Ver detalle y resultados'}
              </Action>
            </View>
          );
        }}
        ListEmptyComponent={
          !history.loading && !history.error ? (
            <View style={styles.card}>
              <Text style={styles.title}>No hay registros en esta sección</Text>
              <Text style={styles.text}>
                {state ? 'Prueba con otro estado o selecciona todos.' : 'Cuando existan registros aparecerán aquí.'}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          meta && meta.last_page > 1 ? (
            <View>
              <Text style={styles.text}>
                Página {meta.current_page} de {meta.last_page} · {meta.total} citas
              </Text>
              <Action secondary disabled={history.loading || page <= 1} onPress={() => changePage(page - 1)}>
                Anterior
              </Action>
              <Action
                secondary
                disabled={history.loading || page >= meta.last_page}
                onPress={() => changePage(page + 1)}
              >
                Ver siguientes
              </Action>
            </View>
          ) : null
        }
      />
    </AccountPage>
  );
}