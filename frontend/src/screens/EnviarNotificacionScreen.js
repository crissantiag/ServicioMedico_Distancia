import React, { useContext, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { UserContext } from '../context/UserContext';
import { useResource } from '../hooks/useResource';
import { AccountPage, Action, Feedback, styles } from '../components/AccountUI';
import { notificaciones } from '../services/notifications';

const GRUPOS = [
  { value: 'g:pacientes', label: 'Todos los pacientes' },
  { value: 'g:medicos', label: 'Todos los médicos' },
  { value: 'g:todos', label: 'Todos los usuarios' },
];
const ROL = { paciente: 'Paciente', medico: 'Médico', administrador: 'Administrador' };

// Médico: avisa a sus pacientes. Administrador: a cualquier usuario o a un grupo.
export default function EnviarNotificacionScreen() {
  const { user } = useContext(UserContext);
  const destinatarios = useResource(notificaciones.destinatarios);
  const [destino, setDestino] = useState('');
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const personas = destinatarios.data?.data || [];

  const enviar = async () => {
    if (!destino) return setError('Elige a quién enviar el aviso.');
    if (!titulo.trim() || !mensaje.trim()) return setError('Escribe un título y un mensaje.');
    setEnviando(true);
    setError('');
    try {
      const base = { titulo: titulo.trim(), mensaje: mensaje.trim() };
      const { data } = await notificaciones.enviar(destino.startsWith('g:')
        ? { ...base, grupo: destino.slice(2) }
        : { ...base, id_usuario: Number(destino.slice(2)) });
      Alert.alert('Aviso enviado',
        data?.enviadas > 1 ? `Se envió a ${data.enviadas} usuarios.` : 'Se envió correctamente.',
        [{ text: 'Aceptar', onPress: () => router.back() }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  };

  return <AccountPage title="Enviar aviso">
    <Feedback loading={destinatarios.loading} error={destinatarios.error} retry={destinatarios.reload} />
    {!destinatarios.loading && !destinatarios.error && <ScrollView contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      {user?.rol === 'medico' && personas.length === 0
        ? <Text style={styles.muted}>Aún no tienes pacientes con citas, así que no hay a quién enviar avisos.</Text>
        : <>
          <View style={styles.field}>
            <Text style={styles.label}>Para</Text>
            <View style={{ borderWidth: 1, borderColor: '#94AFC5', borderRadius: 10, backgroundColor: '#fff' }}>
              <Picker selectedValue={destino} onValueChange={setDestino} accessibilityLabel="Destinatario">
                <Picker.Item label="Elige un destinatario" value="" />
                {user?.rol === 'administrador' && GRUPOS.map(g => <Picker.Item key={g.value} {...g} />)}
                {personas.map(p => <Picker.Item key={p.id_usuario} value={`u:${p.id_usuario}`}
                  label={user?.rol === 'administrador' ? `${p.nombre_completo} (${ROL[p.rol] || p.rol})` : p.nombre_completo} />)}
              </Picker>
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Título</Text>
            <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} maxLength={150}
              placeholder="Ej. Recuerda tus estudios" accessibilityLabel="Título" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Mensaje</Text>
            <TextInput style={[styles.input, { minHeight: 120, paddingTop: 12, textAlignVertical: 'top' }]}
              value={mensaje} onChangeText={setMensaje} maxLength={1000} multiline
              placeholder="Escribe el aviso…" accessibilityLabel="Mensaje" />
          </View>
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          <Action onPress={enviar} disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar aviso'}</Action>
        </>}
    </ScrollView>}
  </AccountPage>;
}