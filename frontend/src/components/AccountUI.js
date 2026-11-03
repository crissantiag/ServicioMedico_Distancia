import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

export function AccountPage({ title, children }) {
  return <SafeAreaView style={styles.page}>
    <View style={styles.header}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Volver al inicio" style={styles.back}
        onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}>
        <MaterialCommunityIcons name="arrow-left" size={26} color="#1E293B" />
      </TouchableOpacity>
      <Text style={styles.heading}>{title}</Text>
    </View>
    {children}
  </SafeAreaView>;
}
export function Action({ children, onPress, disabled = false, secondary = false }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} style={[styles.action, secondary && styles.secondary, disabled && styles.disabled]}>
    <Text style={[styles.actionText, secondary && styles.secondaryText]}>{children}</Text>
  </TouchableOpacity>;
}
export function Feedback({ loading, error, retry }) {
  if (loading) return <View style={styles.feedback}><ActivityIndicator accessibilityLabel="Cargando" color="#3368A0" /><Text>Cargando…</Text></View>;
  if (!error) return null;
  return <View style={styles.feedback} accessibilityRole="alert"><Text style={styles.error}>{error}</Text><Action onPress={retry} secondary>Reintentar</Action></View>;
}
export function appointmentDate(value) {
  if (!value) return 'Fecha no disponible';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : date.toLocaleString('es', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F2EFE7' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderBottomColor: '#DCE5ED' },
  back: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, fontSize: 23, fontWeight: 'bold', color: '#1E293B', marginLeft: 8 },
  content: { padding: 20, paddingBottom: 35 },
  card: { backgroundColor: '#fff', borderRadius: 16, borderColor: '#66A3BF', borderWidth: 1, padding: 18, marginBottom: 14 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#3368A0', marginBottom: 8 },
  text: { fontSize: 15, color: '#334155', lineHeight: 23, marginBottom: 5 },
  muted: { color: '#64748B', fontSize: 14, marginBottom: 10 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#E6F0FA', borderRadius: 8, padding: 7, color: '#24517E', fontWeight: 'bold', marginBottom: 10 },
  action: { backgroundColor: '#3368A0', borderRadius: 10, minHeight: 46, padding: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  actionText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  secondary: { backgroundColor: '#E6F0FA' }, secondaryText: { color: '#24517E' }, disabled: { opacity: 0.45 },
  feedback: { padding: 20, alignItems: 'center', gap: 12 }, error: { color: '#A52B20', fontSize: 15 },
  label: { color: '#334155', fontWeight: 'bold', fontSize: 15, marginBottom: 6 },
  input: { backgroundColor: '#fff', color: '#1E293B', borderWidth: 1, borderColor: '#94AFC5', borderRadius: 10, paddingHorizontal: 12, minHeight: 48, fontSize: 16, marginBottom: 6 },
  field: { marginBottom: 16 }, readonly: { backgroundColor: '#E8EDF1', color: '#526170' },
});
