import React, { useCallback, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { foro, FORO_PAGE_SIZE } from '../services/foro';
import { useResource } from '../hooks/useResource';
import { useReloadOnFocus } from '../hooks/useReloadOnFocus';
import { AccountPage, Action, Feedback, styles } from '../components/AccountUI';
import { Autor, Metricas } from '../components/ForoUI';

export default function ForoScreen() {
  const list = useRef(null);
  const [page, setPage] = useState(1);
  const [texto, setTexto] = useState('');
  const [q, setQ] = useState('');
  const [mias, setMias] = useState(false);
  const load = useCallback(() => foro.listar({ page, q, mias }), [page, q, mias]);
  const result = useResource(load);
  useReloadOnFocus(result.reload);
  const meta = result.data?.meta;

  const buscar = valor => { setQ(valor.trim()); setPage(1); };
  const limpiar = () => { setTexto(''); buscar(''); };
  const cambiarFiltro = valor => { setMias(valor); setPage(1); };
  const changePage = next => {
    setPage(next);
    list.current?.scrollToOffset({ offset: 0, animated: true });
  };

  return <AccountPage title="Foro de salud">
    <View style={local.barra}>
      <Text style={styles.muted}>Comparte tu experiencia y recibe apoyo de otros usuarios.</Text>
      <View style={local.buscador}>
        <MaterialCommunityIcons name="magnify" size={22} color="#64748B" />
        <TextInput style={local.buscadorInput} value={texto} onChangeText={setTexto}
          placeholder="Buscar publicaciones" returnKeyType="search" onSubmitEditing={() => buscar(texto)}
          accessibilityLabel="Buscar publicaciones" />
        {texto ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Borrar búsqueda" onPress={limpiar}
          style={local.limpiar}>
          <MaterialCommunityIcons name="close-circle" size={20} color="#64748B" />
        </TouchableOpacity> : null}
      </View>
      <View style={local.filtros}>
        {[['Todas', false], ['Mis publicaciones', true]].map(([titulo, valor]) =>
          <TouchableOpacity key={titulo} accessibilityRole="button" accessibilityState={{ selected: mias === valor }}
            onPress={() => cambiarFiltro(valor)} style={[local.filtro, mias === valor && local.filtroActivo]}>
            <Text style={[local.filtroTexto, mias === valor && local.filtroTextoActivo]}>{titulo}</Text>
          </TouchableOpacity>)}
      </View>
      <Action onPress={() => router.push('/foro/crear')}>Nueva publicación</Action>
    </View>
    <FlatList ref={list} contentContainerStyle={styles.content} data={result.data?.data || []}
      keyExtractor={item => String(item.id_publicacion)} refreshing={result.loading} onRefresh={result.reload}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<>
        {meta ? <Text style={styles.text}>
          {meta.total} {meta.total === 1 ? 'publicación' : 'publicaciones'}{q ? ` para “${q}”` : ''}
        </Text> : null}
        <Feedback loading={result.loading && !result.data} error={result.error} retry={result.reload} />
      </>}
      renderItem={({ item }) => <View style={styles.card}>
        <Autor usuario={item.usuario} fecha={item.fecha_publicacion} />
        <Text style={styles.title}>{item.titulo}</Text>
        <Text style={styles.text} numberOfLines={4}>{item.contenido}</Text>
        <Metricas apoyos={item.apoyos_count} comentarios={item.comentarios_count} />
        <Action secondary onPress={() => router.push(`/foro/${item.id_publicacion}`)}>Leer y comentar</Action>
      </View>}
      ListEmptyComponent={!result.loading && !result.error ? <View style={styles.card}>
        <Text style={styles.title}>{q || mias ? 'No encontramos publicaciones' : 'Aún no hay publicaciones'}</Text>
        <Text style={styles.text}>
          {q || mias
            ? 'Prueba con otras palabras o revisa el filtro seleccionado.'
            : 'Sé la primera persona en compartir una experiencia con la comunidad.'}
        </Text>
      </View> : null}
      ListFooterComponent={meta && meta.last_page > 1 ? <View>
        <Text style={styles.text}>Página {meta.current_page} de {meta.last_page} · {FORO_PAGE_SIZE} por página</Text>
        <Action secondary disabled={result.loading || page <= 1} onPress={() => changePage(page - 1)}>Anterior</Action>
        <Action secondary disabled={result.loading || page >= meta.last_page} onPress={() => changePage(page + 1)}>Ver siguientes</Action>
      </View> : null}
    />
  </AccountPage>;
}

const local = StyleSheet.create({
  barra: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  buscador: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#94AFC5', borderRadius: 10, paddingLeft: 10, minHeight: 46, marginBottom: 10 },
  buscadorInput: { flex: 1, fontSize: 16, color: '#1E293B', paddingHorizontal: 8, minHeight: 44 },
  limpiar: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  filtros: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  filtro: { flex: 1, minHeight: 40, borderRadius: 10, backgroundColor: '#E6F0FA', alignItems: 'center', justifyContent: 'center' },
  filtroActivo: { backgroundColor: '#3368A0' },
  filtroTexto: { color: '#24517E', fontWeight: 'bold', fontSize: 14 },
  filtroTextoActivo: { color: '#fff' },
});
