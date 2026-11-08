import React, { useCallback, useContext, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { UserContext } from '../context/UserContext';
import { account } from '../services/account';
import { useResource } from '../hooks/useResource';
import { useReloadOnFocus } from '../hooks/useReloadOnFocus';
import { AccountPage, Action, Feedback, styles } from '../components/AccountUI';
import { RecetaContenido } from '../components/RecetaContenido';

export default function RecetaDetalleScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useContext(UserContext);
  const [borrando, setBorrando] = useState(false);
  const load = useCallback(() => account.prescription(id), [id]);
  const result = useResource(load);
  useReloadOnFocus(result.reload);
  const receta = result.data?.data;
  const rol = user?.rol;
  const puedeGestionar = rol === 'medico' || rol === 'administrador';

  const eliminar = () => Alert.alert(
    'Eliminar receta',
    'Se borrará la receta y todos sus medicamentos. Esta acción no se puede deshacer.',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          setBorrando(true);
          try {
            await account.deletePrescription(id);
            if (router.canGoBack()) router.back(); else router.replace('/recetas');
          } catch (error) {
            Alert.alert('No se pudo eliminar', error.message);
            setBorrando(false);
          }
        },
      },
    ],
  );

  return <AccountPage title="Detalle de la receta"><ScrollView contentContainerStyle={styles.content}>
    <Feedback loading={result.loading && !receta} error={result.error} retry={result.reload} />
    {receta ? <>
      <View style={styles.card}>
        <RecetaContenido receta={receta} mostrarPaciente={rol !== 'paciente'} />
      </View>
      {receta.id_cita ? <Action secondary onPress={() => router.push(`/citas/${receta.id_cita}`)}>Ver la cita</Action> : null}
      {puedeGestionar ? <>
        <Action disabled={borrando} onPress={() => router.push(`/recetas/editar?id=${receta.id_receta}`)}>Editar receta</Action>
        <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: borrando }} disabled={borrando}
          onPress={eliminar} style={[{ backgroundColor: '#FDECEA', borderRadius: 10, minHeight: 46, padding: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 }, borrando && { opacity: 0.45 }]}>
          <Text style={{ color: '#A52B20', fontWeight: 'bold', fontSize: 15 }}>{borrando ? 'Eliminando…' : 'Eliminar receta'}</Text>
        </TouchableOpacity>
      </> : null}
    </> : null}
  </ScrollView></AccountPage>;
}
