import React, { useCallback, useRef, useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import { router } from 'expo-router';
import { medicosAdmin, MEDICOS_PAGE_SIZE } from '../services/medicosAdmin';
import { useResource } from '../hooks/useResource';
import { useReloadOnFocus } from '../hooks/useReloadOnFocus';
import { AccountPage, Action, Feedback, styles } from '../components/AccountUI';
import MedicosAdminAccess from '../components/MedicosAdminAccess';

function MedicosList() {
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState('');
  const busy = useRef(false);
  const list = useRef(null);
  const load = useCallback(() => medicosAdmin.list(page), [page]);
  const result = useResource(load);
  useReloadOnFocus(result.reload);
  const meta = result.data?.meta;
  const items = result.data?.data || [];
  const changePage = next => {
    setMessage('');
    setPage(next);
    list.current?.scrollToOffset({ offset: 0, animated: true });
  };
  const remove = async item => {
    if (busy.current) return;
    busy.current = true;
    setDeleting(item.id_medico);
    setMessage('');
    try {
      await medicosAdmin.remove(item.id_medico);
      setMessage('Médico eliminado correctamente.');
      if (items.length === 1 && page > 1) setPage(value => value - 1);
      else result.reload();
    } catch (error) {
      Alert.alert('No se pudo eliminar', error.message);
    } finally {
      busy.current = false;
      setDeleting(null);
    }
  };
  const confirmRemove = item => Alert.alert(
    'Eliminar médico',
    `¿Eliminar a ${item.nombre_completo}? Los médicos con citas, centros u otros registros relacionados se conservarán.`,
    [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: () => remove(item) }],
  );
  return <AccountPage title="Administrar médicos">
    <FlatList ref={list} contentContainerStyle={styles.content} data={items}
      keyExtractor={item => String(item.id_medico)} refreshing={result.loading} onRefresh={result.reload}
      ListHeaderComponent={<View style={{ marginBottom: 18 }}>
        <Text style={styles.text}>Crea y mantén los perfiles del equipo médico.</Text>
        <Action disabled={deleting !== null} onPress={() => router.push('/admin-medicos/crear')}>Nuevo médico</Action>
        <Text style={[styles.muted, { marginTop: 12 }]}>{MEDICOS_PAGE_SIZE} médicos por página{meta ? ` · ${meta.total} en total` : ''}</Text>
        {message ? <Text accessibilityRole="alert" style={styles.text}>{message}</Text> : null}
        <Feedback loading={result.loading && !result.data} error={result.error} retry={result.reload} />
      </View>}
      renderItem={({ item }) => <View style={styles.card}>
        <Text style={styles.title}>{item.nombre_completo}</Text>
        <Text style={styles.text}>{item.especialidad?.nombre_especialidad || 'Sin especialidad'}</Text>
        <Text style={styles.text}>Centros: {item.centros?.map(centro => centro.nombre_centro).join(', ') || 'Sin centro asignado'}</Text>
        <Text style={styles.muted}>{item.disponibilidad || 'Disponibilidad no especificada'}</Text>
        <Action secondary disabled={deleting !== null} onPress={() => router.push(`/admin-medicos/${item.id_medico}`)}>Ver / editar</Action>
        <Action secondary disabled={deleting !== null} onPress={() => confirmRemove(item)}>{deleting === item.id_medico ? 'Eliminando…' : 'Eliminar médico'}</Action>
      </View>}
      ListEmptyComponent={!result.loading && !result.error ? <View style={styles.card}>
        <Text style={styles.title}>No hay médicos registrados</Text>
        <Text style={styles.text}>Pulsa Nuevo médico para agregar el primero.</Text>
      </View> : null}
      ListFooterComponent={meta && meta.last_page > 1 ? <View>
        <Text style={styles.text}>Página {meta.current_page} de {meta.last_page}</Text>
        <Action secondary disabled={result.loading || deleting !== null || page <= 1} onPress={() => changePage(page - 1)}>Anterior</Action>
        <Action secondary disabled={result.loading || deleting !== null || page >= meta.last_page} onPress={() => changePage(page + 1)}>Ver siguientes</Action>
      </View> : null}
    />
  </AccountPage>;
}

export default function MedicosAdminScreen() {
  return <MedicosAdminAccess><MedicosList /></MedicosAdminAccess>;
}
