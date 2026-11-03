import React, { useCallback, useContext, useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { UserContext } from '../context/UserContext';
import { account, HISTORY_PAGE_SIZE } from '../services/account';
import { useResource } from '../hooks/useResource';
import { AccountPage, Action, Feedback, appointmentDate, styles } from '../components/AccountUI';

export default function HistorialScreen() {
  const { user } = useContext(UserContext);
  const list = useRef(null);
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);
  const load = useCallback(() => account.appointments(user?.id_usuario, { state, page }), [user?.id_usuario, state, page]);
  const history = useResource(load);
  const states = useResource(account.states);
  const meta = history.data?.meta;
  const changePage = next => {
    setPage(next);
    list.current?.scrollToOffset({ offset: 0, animated: true });
  };
  const first = meta?.total ? (meta.current_page - 1) * meta.per_page + 1 : 0;
  const last = meta ? Math.min(meta.current_page * meta.per_page, meta.total) : 0;
  return <AccountPage title="Historial de citas">
    <FlatList ref={list} contentContainerStyle={styles.content} data={history.data?.data || []}
      keyExtractor={item => String(item.id_cita)} refreshing={history.loading} onRefresh={history.reload}
      ListHeaderComponent={<>
        <Text style={styles.muted}>Consulta tus citas, su estado y los detalles de cada atención.</Text>
        <Text style={styles.muted}>{HISTORY_PAGE_SIZE} citas por página</Text>
        <Text style={styles.label}>Estado de la cita</Text>
        <View style={[styles.input, { paddingHorizontal: 0 }]}>
          <Picker accessibilityLabel="Filtrar citas por estado" selectedValue={state}
            onValueChange={value => { setState(value); setPage(1); }}>
            <Picker.Item label="Todos los estados" value="" />
            {(states.data?.data || []).map(item => <Picker.Item key={item.id_estado} label={item.nombre_estado} value={String(item.id_estado)} />)}
          </Picker>
        </View>
        <Feedback loading={false} error={states.error} retry={states.reload} />
        {meta ? <Text style={styles.text}>Mostrando {first}–{last} de {meta.total} citas</Text> : null}
        <Feedback loading={history.loading} error={history.error} retry={history.reload} />
      </>}
      renderItem={({ item }) => <View style={styles.card}>
        <Text style={styles.badge}>{item.estado?.nombre_estado || 'Estado no disponible'}</Text>
        <Text style={styles.title}>{item.medico?.nombre_completo || 'Médico no disponible'}</Text>
        <Text style={styles.text}>{item.medico?.especialidad?.nombre_especialidad || 'Sin especialidad'}</Text>
        <Text style={styles.text}>{appointmentDate(item.fecha_hora)}</Text>
        <Text style={styles.text} numberOfLines={2}>{item.motivo_consulta || 'Sin motivo registrado'}</Text>
        <Action secondary onPress={() => router.push(`/citas/${item.id_cita}`)}>Ver detalle</Action>
      </View>}
      ListEmptyComponent={!history.loading && !history.error ? <View style={styles.card}>
        <Text style={styles.title}>No hay citas para mostrar</Text>
        <Text style={styles.text}>{state ? 'Prueba con otro estado o selecciona todos.' : 'Cuando tengas citas registradas aparecerán aquí.'}</Text>
      </View> : null}
      ListFooterComponent={meta && meta.last_page > 1 ? <View>
        <Text style={styles.text}>Página {meta.current_page} de {meta.last_page} · {meta.total} citas</Text>
        <Action secondary disabled={history.loading || page <= 1} onPress={() => changePage(page - 1)}>Anterior</Action>
        <Action secondary disabled={history.loading || page >= meta.last_page} onPress={() => changePage(page + 1)}>Ver siguientes</Action>
      </View> : null}
    />
  </AccountPage>;
}
