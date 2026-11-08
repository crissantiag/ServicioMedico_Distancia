import React, { useCallback, useContext, useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { router } from 'expo-router';
import { UserContext } from '../context/UserContext';
import { account, PRESCRIPTION_PAGE_SIZE } from '../services/account';
import { useResource } from '../hooks/useResource';
import { useReloadOnFocus } from '../hooks/useReloadOnFocus';
import { AccountPage, Action, Feedback, styles } from '../components/AccountUI';
import { RecetaContenido } from '../components/RecetaContenido';

export default function RecetasScreen() {
  const { user } = useContext(UserContext);
  const list = useRef(null);
  const [page, setPage] = useState(1);
  const load = useCallback(() => account.prescriptions({ page }), [page]);
  const result = useResource(load);
  useReloadOnFocus(result.reload);
  const meta = result.data?.meta;
  const esPaciente = user?.rol === 'paciente';
  const changePage = next => {
    setPage(next);
    list.current?.scrollToOffset({ offset: 0, animated: true });
  };
  return <AccountPage title="Recetas">
    <FlatList ref={list} contentContainerStyle={styles.content} data={result.data?.data || []}
      keyExtractor={item => String(item.id_receta)} refreshing={result.loading} onRefresh={result.reload}
      ListHeaderComponent={<>
        <Text style={styles.muted}>
          {esPaciente ? 'Revisa los medicamentos que te han recetado.' : 'Recetas emitidas a tus pacientes.'}
        </Text>
        <Text style={styles.muted}>{PRESCRIPTION_PAGE_SIZE} recetas por página</Text>
        {meta ? <Text style={styles.text}>{meta.total} {meta.total === 1 ? 'receta' : 'recetas'}</Text> : null}
        <Feedback loading={result.loading && !result.data} error={result.error} retry={result.reload} />
      </>}
      renderItem={({ item }) => <View style={styles.card}>
        <RecetaContenido receta={item} mostrarPaciente={!esPaciente} />
        <Action secondary onPress={() => router.push(`/recetas/${item.id_receta}`)}>Ver detalle</Action>
      </View>}
      ListEmptyComponent={!result.loading && !result.error ? <View style={styles.card}>
        <Text style={styles.title}>No hay recetas para mostrar</Text>
        <Text style={styles.text}>
          {esPaciente
            ? 'Cuando un médico te emita una receta aparecerá aquí.'
            : 'Abre una cita desde "Mis citas" para emitir una receta.'}
        </Text>
      </View> : null}
      ListFooterComponent={meta && meta.last_page > 1 ? <View>
        <Text style={styles.text}>Página {meta.current_page} de {meta.last_page}</Text>
        <Action secondary disabled={result.loading || page <= 1} onPress={() => changePage(page - 1)}>Anterior</Action>
        <Action secondary disabled={result.loading || page >= meta.last_page} onPress={() => changePage(page + 1)}>Ver siguientes</Action>
      </View> : null}
    />
  </AccountPage>;
}
