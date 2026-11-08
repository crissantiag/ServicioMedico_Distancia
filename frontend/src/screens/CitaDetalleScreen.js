import React, { useCallback, useContext } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { UserContext } from '../context/UserContext';
import { account } from '../services/account';
import { useResource } from '../hooks/useResource';
import { useReloadOnFocus } from '../hooks/useReloadOnFocus';
import { AccountPage, Action, Feedback, appointmentDate, styles } from '../components/AccountUI';

export default function CitaDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useContext(UserContext);
  const load = useCallback(() => account.appointment(id), [id]);
  const result = useResource(load);
  useReloadOnFocus(result.reload);
  const cita = result.data?.data;
  const esMedico = user?.rol === 'medico';
  const puedeRecetar = esMedico && cita && !cita.receta && cita.estado?.nombre_estado !== 'Cancelada';
  return <AccountPage title="Detalle de la cita"><ScrollView contentContainerStyle={styles.content}>
    <Feedback loading={result.loading && !cita} error={result.error} retry={result.reload} />
    {cita ? <>
      <View style={styles.card}>
        <Text style={styles.badge}>{cita.estado?.nombre_estado || 'Estado no disponible'}</Text>
        <Text style={styles.title}>{esMedico
          ? cita.usuario?.nombre_completo || 'Paciente no disponible'
          : cita.medico?.nombre_completo || 'Médico no disponible'}</Text>
        <Text style={styles.text}>{cita.medico?.especialidad?.nombre_especialidad || 'Sin especialidad'}</Text>
        <Text style={styles.label}>Fecha y hora</Text><Text style={styles.text}>{appointmentDate(cita.fecha_hora)}</Text>
        <Text style={styles.label}>Motivo de consulta</Text><Text style={styles.text}>{cita.motivo_consulta || 'Sin motivo registrado'}</Text>
        <Text style={styles.muted}>Cita número {cita.id_cita}</Text>
      </View>
      {cita.receta ? <View style={styles.card}>
        <Text style={styles.title}>Receta</Text>
        <Text style={styles.text}>{cita.receta.indicaciones_generales || 'Sin indicaciones generales'}</Text>
        {(cita.receta.detalles || []).map(item => <View key={item.id_detalle} style={{ marginTop: 10 }}>
          <Text style={styles.label}>{item.medicamento?.nombre_medicamento || 'Medicamento'}</Text>
          <Text style={styles.text}>{[item.dosis, item.frecuencia, item.duracion].filter(Boolean).join(' · ')}</Text>
        </View>)}
        <Action secondary onPress={() => router.push(`/recetas/${cita.receta.id_receta}`)}>Ver receta completa</Action>
      </View> : null}
      {puedeRecetar ? <Action onPress={() => router.push(`/recetas/crear?id_cita=${cita.id_cita}`)}>Emitir receta</Action> : null}
    </> : null}
  </ScrollView></AccountPage>;
}
