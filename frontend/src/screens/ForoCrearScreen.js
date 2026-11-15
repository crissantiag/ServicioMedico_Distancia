import React, { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { foro } from '../services/foro';
import { useResource } from '../hooks/useResource';
import { AccountPage, Action, Feedback, styles } from '../components/AccountUI';

const MAX_TITULO = 200;
const MAX_CONTENIDO = 5000;

// Sirve para publicar (sin id) y para editar (con ?id=).
export default function ForoCrearScreen() {
  const { id } = useLocalSearchParams();
  const editando = !!id;
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(() => (id ? foro.ver(id) : Promise.resolve(null)), [id]);
  const existente = useResource(cargar);
  const publicacion = existente.data?.data;

  useEffect(() => {
    if (publicacion) {
      setTitulo(publicacion.titulo);
      setContenido(publicacion.contenido);
    }
  }, [publicacion]);

  const guardar = async () => {
    const body = { titulo: titulo.trim(), contenido: contenido.trim() };
    if (!body.titulo || !body.contenido) {
      setError('Escribe un título y cuéntanos tu experiencia.');
      return;
    }
    setError('');
    setGuardando(true);
    try {
      if (editando) {
        await foro.editar(id, body);
        router.canGoBack() ? router.back() : router.replace(`/foro/${id}`);
      } else {
        const creada = await foro.crear(body);
        router.replace(`/foro/${creada.data.id_publicacion}`);
      }
    } catch (e) {
      const detalle = e.errors ? Object.values(e.errors).flat().join(' ') : '';
      Alert.alert('No se pudo guardar', detalle || e.message);
    } finally {
      setGuardando(false);
    }
  };

  return <AccountPage title={editando ? 'Editar publicación' : 'Nueva publicación'}>
    <KeyboardAvoidingView style={local.flex} behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Antes de publicar</Text>
          <Text style={styles.text}>
            Comparte con respeto y evita datos personales como teléfono, dirección o documentos. Este foro es un espacio
            de apoyo entre usuarios y no reemplaza una consulta médica. Si es una emergencia, acude al servicio de
            emergencias de tu localidad.
          </Text>
        </View>
        <Feedback loading={editando && existente.loading && !existente.data} error={existente.error} retry={existente.reload} />
        <View style={styles.field}>
          <Text style={styles.label}>Título</Text>
          <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} maxLength={MAX_TITULO}
            placeholder="Ej. Consejos para dormir mejor" accessibilityLabel="Título" />
          <Text style={styles.muted}>{titulo.length}/{MAX_TITULO}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Tu experiencia</Text>
          <TextInput style={[styles.input, local.area]} value={contenido} onChangeText={setContenido} multiline
            maxLength={MAX_CONTENIDO} textAlignVertical="top" placeholder="Cuéntanos qué te pasó, qué te ayudó o qué dudas tienes"
            accessibilityLabel="Tu experiencia" />
          <Text style={styles.muted}>{contenido.length}/{MAX_CONTENIDO}</Text>
        </View>
        {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
        <Action disabled={guardando || (editando && !publicacion)} onPress={guardar}>
          {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Publicar'}
        </Action>
        <Action secondary disabled={guardando} onPress={() => router.canGoBack() ? router.back() : router.replace('/foro')}>Cancelar</Action>
      </ScrollView>
    </KeyboardAvoidingView>
  </AccountPage>;
}

const local = StyleSheet.create({
  flex: { flex: 1 },
  area: { minHeight: 180, paddingTop: 12 },
});
