import React, { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { account } from '../services/account';
import { useResource } from '../hooks/useResource';
import { AccountPage, Feedback, appointmentDate, styles } from '../components/AccountUI';

export default function CitaDetalleScreen() {
  const { id } = useLocalSearchParams();
  const load = useCallback(() => account.appointment(id), [id]);
  const result = useResource(load);
  const cita = result.data?.data;
  return <AccountPage title="Detalle de la cita"><ScrollView contentContainerStyle={styles.content}>
    <Feedback loading={result.loading} error={result.error} retry={result.reload} />
    {cita ? <>
      <View style={styles.card}>
        <Text style={styles.badge}>{cita.estado?.nombre_estado || 'Estado no disponible'}</Text>
        <Text style={styles.title}>{cita.medico?.nombre_completo || 'Médico no disponible'}</Text>
        <Text style={styles.text}>{cita.medico?.especialidad?.nombre_especialidad || 'Sin especialidad'}</Text>
        <Text style={styles.label}>Fecha y hora</Text><Text style={styles.text}>{appointmentDate(cita.fecha_hora)}</Text>
        <Text style={styles.label}>Motivo de consulta</Text><Text style={styles.text}>{cita.motivo_consulta || 'Sin motivo registrado'}</Text>
        <Text style={styles.muted}>Cita número {cita.id_cita}</Text>
      </View>
      {cita.receta ? <View style={styles.card}>
        <Text style={styles.title}>Indicaciones registradas</Text>
        <Text style={styles.text}>{cita.receta.indicaciones_generales || 'Sin indicaciones generales'}</Text>
        {(cita.receta.detalles || []).map(item => <View key={item.id_detalle} style={{ marginTop: 10 }}>
          <Text style={styles.label}>{item.medicamento?.nombre_medicamento || 'Medicamento'}</Text>
          <Text style={styles.text}>{[item.dosis, item.frecuencia, item.duracion].filter(Boolean).join(' · ')}</Text>
        </View>)}
      </View> : null}
    </> : null}
  </ScrollView></AccountPage>;
}
