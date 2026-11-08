import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Contenedor de las pantallas con barra inferior: título centrado y sin flecha de volver.
export function TabPage({ title, children }) {
  return <SafeAreaView style={s.page} edges={['top']}>
    <View style={s.header}>
      <Text accessibilityRole="header" style={s.title}>{title}</Text>
    </View>
    {children}
  </SafeAreaView>;
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#DCE3F2' },
  header: {
    alignItems: 'center', paddingVertical: 18, backgroundColor: '#DCE3F2',
    borderBottomWidth: 2, borderBottomColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 3,
  },
  title: { fontSize: 22, fontWeight: '600', color: '#2F3B52' },
});