import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';
import { chat } from '../services/chat';
import { AccountPage } from '../components/AccountUI';
import Pusher from 'pusher-js';
import { apiBase } from '../services/config';
import { getToken } from '../services/session';

const POLL_MS = 3000;

const hour = value => {
  const d = new Date(String(value || '').replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
};

export default function ChatScreen() {
  const { id, nombre } = useLocalSearchParams();
  const { user } = useContext(UserContext);
  const me = user?.rol === 'medico' ? 'medico' : 'usuario';

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const list = useRef(null);
  const lastId = useRef(0);
  const busy = useRef(false);

  const merge = useCallback(incoming => {
    if (!incoming.length) return;
    setMessages(current => {
      const known = new Set(current.map(m => m.id_mensaje));
      const added = incoming.filter(m => !known.has(m.id_mensaje));
      return added.length ? [...current, ...added] : current;
    });
    lastId.current = Math.max(lastId.current, ...incoming.map(m => Number(m.id_mensaje)));
  }, []);

  // Pide solo los mensajes posteriores al último que ya se tiene.
  const poll = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      merge((await chat.messages(id, lastId.current)).data || []);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      busy.current = false;
    }
  }, [id, merge]);

  // Tiempo real por WebSocket (Laravel Reverb). Si no hay clave configurada, consulta cada 3 s.
  useFocusEffect(useCallback(() => {
    const cluster = process.env.EXPO_PUBLIC_PUSHER_CLUSTER; // Pusher en la nube
    const key = process.env.EXPO_PUBLIC_PUSHER_KEY || process.env.EXPO_PUBLIC_REVERB_KEY;
    let pusher;
    let cancelled = false;
    poll();
    if (key) {
      (async () => {
        try {
          const base = apiBase();
          const host = base.replace(/^https?:\/\//, '').split(/[:/]/)[0];
          const token = await getToken();
          if (cancelled) return;
          const connection = cluster
            ? { cluster, forceTLS: true }
            : {
              cluster: 'mt1',
              wsHost: host,
              wsPort: Number(process.env.EXPO_PUBLIC_REVERB_PORT || 8080),
              wssPort: Number(process.env.EXPO_PUBLIC_REVERB_PORT || 8080),
              forceTLS: false,
              enabledTransports: ['ws', 'wss'],
            };
          pusher = new Pusher(key, {
            ...connection,
            channelAuthorization: {
              endpoint: `${base}/broadcasting/auth`,
              transport: 'ajax',
              headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            },
          });
          // Al (re)conectar, trae lo que se pudo perder mientras estuvo caído.
          pusher.connection.bind('connected', poll);
          pusher.subscribe(`private-conversacion.${id}`).bind('mensaje', e => {
            if (e?.mensaje) merge([e.mensaje]);
          });
        } catch (e) {
          setError(e.message);
        }
      })();
    }
    // Con WebSocket basta un respaldo lento; sin él, consulta cada 3 s.
    const timer = setInterval(poll, key ? 30000 : POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
      pusher?.disconnect();
    };
  }, [id, poll, merge]));

  useEffect(() => {
    if (messages.length) setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const { data } = await chat.send(id, content);
      setText('');
      merge([data]);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  return <AccountPage title={String(nombre || 'Chat')}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <FlatList
        ref={list}
        style={{ flex: 1 }}
        contentContainerStyle={s.listContent}
        data={messages}
        keyExtractor={item => String(item.id_mensaje)}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={<Text style={s.empty}>Escribe el primer mensaje.</Text>}
        renderItem={({ item }) => {
          const mine = item.enviado_por === me;
          return <View style={[s.bubble, mine ? s.mine : s.theirs]}>
            <Text style={[s.bubbleText, mine && s.mineText]}>{item.contenido}</Text>
            <Text style={[s.time, mine && s.mineText]}>{hour(item.fecha_envio)}</Text>
          </View>;
        }}
      />
      {error ? <Text style={s.error}>{error}</Text> : null}
      <View style={s.composer}>
        <TextInput style={s.input} value={text} onChangeText={setText} placeholder="Escribe un mensaje"
          placeholderTextColor="#888" multiline maxLength={2000} />
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Enviar" disabled={sending || !text.trim()}
          onPress={send} style={[s.sendBtn, (sending || !text.trim()) && { opacity: 0.45 }]}>
          <MaterialCommunityIcons name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  </AccountPage>;
}

const s = StyleSheet.create({
  listContent: { padding: 16, flexGrow: 1 },
  empty: { textAlign: 'center', color: '#64748B', marginTop: 40 },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 8 },
  mine: { alignSelf: 'flex-end', backgroundColor: '#3368A0', borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#fff', borderColor: '#66A3BF', borderWidth: 1, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 16, color: '#1E293B' },
  mineText: { color: '#fff' },
  time: { fontSize: 11, color: '#64748B', alignSelf: 'flex-end', marginTop: 2 },
  error: { color: '#A52B20', textAlign: 'center', paddingHorizontal: 12, paddingTop: 4, fontSize: 13 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#DCE5ED' },
  input: { flex: 1, maxHeight: 110, minHeight: 46, backgroundColor: '#F2EFE7', borderRadius: 14, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontSize: 16, color: '#1E293B' },
  sendBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#3368A0', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});