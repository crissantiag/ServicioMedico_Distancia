import React, { useCallback, useContext, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';
import { chat } from '../services/chat';
import { AccountPage, Feedback, styles } from '../components/AccountUI';

const POLL_MS = 5000;

export default function ChatListScreen() {
  const { user } = useContext(UserContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setItems((await chat.conversations()).data || []);
      setError('');
    } catch (e) {
      if (!silent) setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Carga al entrar y se actualiza sola mientras la pantalla está visible.
  useFocusEffect(useCallback(() => {
    load();
    const timer = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(timer);
  }, [load]));

  const isDoctor = user?.rol === 'medico';

  return <AccountPage title="Chat">
    <FlatList
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={item => String(item.id_conversacion)}
      refreshing={loading}
      onRefresh={() => load()}
      ListHeaderComponent={<>
        <Text style={styles.muted}>
          {isDoctor ? 'Mensajes de tus pacientes.' : 'Conversa en tiempo real con médicos y especialistas.'}
        </Text>
        <Feedback loading={loading && !items.length} error={error} retry={() => load()} />
      </>}
      renderItem={({ item }) => {
        const name = isDoctor ? item.usuario?.nombre_completo : item.medico?.nombre_completo;
        const last = item.ultimo_mensaje;
        const unread = Number(item.no_leidos || 0);
        return <TouchableOpacity activeOpacity={0.8} style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}
          onPress={() => router.push({ pathname: '/chat/[id]', params: { id: String(item.id_conversacion), nombre: name || 'Chat' } })}>
          <MaterialCommunityIcons name="chat-processing-outline" size={34} color="#3368A0" style={{ marginRight: 14 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { marginBottom: 2 }]}>{name || 'Sin nombre'}</Text>
            {!isDoctor && item.medico?.especialidad?.nombre_especialidad
              ? <Text style={styles.muted}>{item.medico.especialidad.nombre_especialidad}</Text> : null}
            <Text style={[styles.text, { marginBottom: 0 }]} numberOfLines={1}>
              {last?.contenido || 'Aún no hay mensajes'}
            </Text>
          </View>
          {unread > 0 ? <View style={{ minWidth: 24, height: 24, borderRadius: 12, backgroundColor: '#3368A0', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>{unread > 99 ? '99+' : unread}</Text>
          </View> : null}
        </TouchableOpacity>;
      }}
      ListEmptyComponent={!loading && !error ? <View style={styles.card}>
        <Text style={styles.title}>Sin conversaciones</Text>
        <Text style={styles.text}>
          {isDoctor ? 'Cuando un paciente te escriba, aparecerá aquí.' : 'Entra a "Médicos" y toca "Enviar mensaje" para iniciar una.'}
        </Text>
      </View> : null}
    />
  </AccountPage>;
}