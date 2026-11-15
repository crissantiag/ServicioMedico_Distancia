import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';
import { foro, FORO_COMENTARIOS_PAGE_SIZE } from '../services/foro';
import { useResource } from '../hooks/useResource';
import { useReloadOnFocus } from '../hooks/useReloadOnFocus';
import { AccountPage, Action, Feedback, styles } from '../components/AccountUI';
import { ApoyoBoton, Autor } from '../components/ForoUI';

const MAX_COMENTARIO = 1000;

export default function ForoDetalleScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useContext(UserContext);
  const [pagina, setPagina] = useState(1);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [apoyando, setApoyando] = useState(false);
  const [apoyoLocal, setApoyoLocal] = useState(null);

  const cargarPublicacion = useCallback(() => foro.ver(id), [id]);
  const cargarComentarios = useCallback(() => foro.comentarios(id, { page: pagina }), [id, pagina]);
  const pub = useResource(cargarPublicacion);
  const com = useResource(cargarComentarios);
  const recargar = () => { pub.reload(); com.reload(); };
  useReloadOnFocus(recargar);

  // Cuando llegan datos nuevos del servidor, vuelven a mandar sobre el apoyo local.
  useEffect(() => { setApoyoLocal(null); }, [pub.data]);

  const publicacion = pub.data?.data;
  const meta = com.data?.meta;
  const esAdmin = user?.rol === 'administrador';
  const puedeGestionarla = publicacion && (esAdmin || publicacion.id_usuario === user?.id_usuario);
  const totalComentarios = meta?.total ?? publicacion?.comentarios_count ?? 0;
  const apoyado = apoyoLocal ? apoyoLocal.apoyado_por_mi : !!publicacion?.apoyado_por_mi;
  const totalApoyos = apoyoLocal ? apoyoLocal.apoyos_count : (publicacion?.apoyos_count ?? 0);

  const apoyar = async () => {
    setApoyando(true);
    try {
      setApoyoLocal((await foro.apoyar(id)).data);
    } catch (error) {
      Alert.alert('No se pudo registrar tu apoyo', error.message);
    } finally {
      setApoyando(false);
    }
  };

  const eliminarPublicacion = () => Alert.alert('Eliminar publicación', 'Se borrarán también sus comentarios. ¿Continuar?', [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          await foro.eliminar(id);
          router.canGoBack() ? router.back() : router.replace('/foro');
        } catch (error) {
          Alert.alert('No se pudo eliminar', error.message);
        }
      },
    },
  ]);

  const eliminarComentario = comentario => Alert.alert('Eliminar comentario', '¿Quieres borrar este comentario?', [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          await foro.eliminarComentario(comentario.id_comentario);
          com.reload();
        } catch (error) {
          Alert.alert('No se pudo eliminar', error.message);
        }
      },
    },
  ]);

  const comentar = async () => {
    const contenido = texto.trim();
    if (!contenido) return;
    setEnviando(true);
    try {
      await foro.comentar(id, contenido);
      setTexto('');
      // El comentario nuevo queda al final: se salta a la última página.
      const ultima = Math.max(1, Math.ceil((totalComentarios + 1) / FORO_COMENTARIOS_PAGE_SIZE));
      if (ultima !== pagina) setPagina(ultima); else com.reload();
    } catch (error) {
      Alert.alert('No se pudo publicar tu comentario', error.message);
    } finally {
      setEnviando(false);
    }
  };

  const encabezado = <View>
    <Feedback loading={pub.loading && !pub.data} error={pub.error} retry={pub.reload} />
    {publicacion ? <View style={styles.card}>
      <Autor usuario={publicacion.usuario} fecha={publicacion.fecha_publicacion} />
      <Text style={styles.title}>{publicacion.titulo}</Text>
      <Text style={styles.text}>{publicacion.contenido}</Text>
      <ApoyoBoton apoyado={apoyado} total={totalApoyos} onPress={apoyar} disabled={apoyando} />
      {puedeGestionarla ? <>
        <Action secondary onPress={() => router.push({ pathname: '/foro/crear', params: { id } })}>Editar publicación</Action>
        <Action secondary onPress={eliminarPublicacion}>Eliminar publicación</Action>
      </> : null}
    </View> : null}
    {publicacion ? <Text style={styles.label}>Comentarios ({totalComentarios})</Text> : null}
    <Feedback loading={com.loading && !com.data} error={com.error} retry={com.reload} />
  </View>;

  return <AccountPage title="Publicación">
    <KeyboardAvoidingView style={local.flex} behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <FlatList contentContainerStyle={styles.content} data={com.data?.data || []}
        keyExtractor={item => String(item.id_comentario)} keyboardShouldPersistTaps="handled"
        refreshing={pub.loading || com.loading} onRefresh={recargar}
        ListHeaderComponent={encabezado}
        renderItem={({ item }) => <View style={local.comentario}>
          <Autor usuario={item.usuario} fecha={item.created_at} />
          <Text style={styles.text}>{item.contenido}</Text>
          {esAdmin || item.id_usuario === user?.id_usuario ? <TouchableOpacity accessibilityRole="button"
            accessibilityLabel="Eliminar comentario" onPress={() => eliminarComentario(item)} style={local.borrar}>
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#A52B20" />
            <Text style={local.borrarTexto}>Eliminar</Text>
          </TouchableOpacity> : null}
        </View>}
        ListEmptyComponent={publicacion && !com.loading && !com.error ? <Text style={styles.muted}>
          Todavía no hay comentarios. Sé la primera persona en dar tu apoyo.
        </Text> : null}
        ListFooterComponent={meta && meta.last_page > 1 ? <View>
          <Text style={styles.text}>Página {meta.current_page} de {meta.last_page}</Text>
          <Action secondary disabled={com.loading || pagina <= 1} onPress={() => setPagina(pagina - 1)}>Comentarios anteriores</Action>
          <Action secondary disabled={com.loading || pagina >= meta.last_page} onPress={() => setPagina(pagina + 1)}>Comentarios siguientes</Action>
        </View> : null}
      />
      {publicacion ? <View style={local.compositor}>
        <TextInput style={local.compositorInput} value={texto} onChangeText={setTexto} multiline
          maxLength={MAX_COMENTARIO} placeholder="Escribe un comentario de apoyo…" accessibilityLabel="Escribir comentario" />
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Enviar comentario"
          disabled={enviando || !texto.trim()} onPress={comentar}
          style={[local.enviar, (enviando || !texto.trim()) && local.enviarOff]}>
          <MaterialCommunityIcons name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View> : null}
    </KeyboardAvoidingView>
  </AccountPage>;
}

const local = StyleSheet.create({
  flex: { flex: 1 },
  comentario: { backgroundColor: '#fff', borderRadius: 14, borderColor: '#DCE5ED', borderWidth: 1, padding: 14, marginBottom: 10 },
  borrar: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', minHeight: 36 },
  borrarTexto: { color: '#A52B20', fontSize: 14 },
  compositor: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#DCE5ED' },
  compositorInput: { flex: 1, maxHeight: 110, minHeight: 46, backgroundColor: '#fff', borderWidth: 1, borderColor: '#94AFC5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: '#1E293B' },
  enviar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#3368A0', alignItems: 'center', justifyContent: 'center' },
  enviarOff: { opacity: 0.45 },
});
