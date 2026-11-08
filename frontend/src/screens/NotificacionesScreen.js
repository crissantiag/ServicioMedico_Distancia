import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TabPage } from '../components/TabPage';

// La API todavía no tiene endpoint de notificaciones.
export default function NotificacionesScreen() {
  return <TabPage title="Notificaciones">
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={s.tarjeta}>
        <MaterialCommunityIcons name="bell-outline" size={48} color="#5B667D" />
        <Text style={s.titulo}>Sin notificaciones</Text>
        <Text style={s.texto}>Aquí verás los recordatorios de tus citas y los avisos de tus médicos.</Text>
      </View>
    </ScrollView>
  </TabPage>;
}

const s = StyleSheet.create({
  tarjeta: { backgroundColor: '#F2F6FF', borderRadius: 18, padding: 32, alignItems: 'center', gap: 8 },
  titulo: { fontSize: 18, fontWeight: '600', color: '#2F3B52' },
  texto: { fontSize: 15, color: '#5B667D', textAlign: 'center' },
});