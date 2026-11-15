import React, { useCallback, useContext, useState, useEffect } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { UserContext } from '../context/UserContext';
import { account } from '../services/account';
import { api } from '../services/api';
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
  const registroActual = cita?.historial?.[0];
  const esMedico = user?.rol === 'medico';
  const puedeRecetar = esMedico && cita && !cita.receta && cita.estado?.nombre_estado !== 'Cancelada';

  // Estados para formulario clínico del médico
  const [diagnostico, setDiagnostico] = useState('');
  const [tratamiento, setTratamiento] = useState('');
  const [resultadosPruebas, setResultadosPruebas] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (registroActual) {
      setDiagnostico(registroActual.diagnostico || '');
      setTratamiento(registroActual.tratamiento || '');
      setResultadosPruebas(registroActual.resultados_pruebas || '');
    }
  }, [registroActual]);

  const handleGuardarExpediente = async () => {
    if (!diagnostico.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa el diagnóstico de la consulta.');
      return;
    }

    setGuardando(true);
    try {
      await api.post('historial-medico', {
        id_cita: cita.id_cita,
        diagnostico: diagnostico.trim(),
        tratamiento: tratamiento.trim() || null,
        resultados_pruebas: resultadosPruebas.trim() || null,
      });
      Alert.alert('Guardado', 'El registro de consulta y resultados de pruebas fueron guardados.');
      result.reload();
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo guardar el registro clínico.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <AccountPage title="Expediente de la Consulta">
      <ScrollView contentContainerStyle={styles.content}>
        <Feedback loading={result.loading && !cita} error={result.error} retry={result.reload} />

        {cita ? (
          <>
            {/* 1. Datos de la Consulta */}
            <View style={styles.card}>
              <Text style={styles.badge}>{cita.estado?.nombre_estado || 'Estado no disponible'}</Text>
              <Text style={styles.title}>
                {esMedico
                  ? `Paciente: ${cita.usuario?.nombre_completo || 'Paciente no disponible'}`
                  : cita.medico?.nombre_completo || 'Médico no disponible'}
              </Text>
              <Text style={styles.text}>{cita.medico?.especialidad?.nombre_especialidad || 'Sin especialidad'}</Text>
              <Text style={styles.label}>Fecha y hora</Text>
              <Text style={styles.text}>{appointmentDate(cita.fecha_hora)}</Text>
              <Text style={styles.label}>Motivo de consulta</Text>
              <Text style={styles.text}>{cita.motivo_consulta || 'Sin motivo registrado'}</Text>
              <Text style={styles.muted}>Consulta #{cita.id_cita}</Text>
            </View>

            {/* 2. Registro de Consulta y Resultados de Pruebas */}
            <View style={styles.card}>
              <Text style={styles.label}>Tratamiento y Resultados de Pruebas</Text>
                <Text style={styles.text}>
                  {registroActual?.observaciones || 'Sin resultados de laboratorio registrados.'}
                </Text>
              {esMedico && cita.estado?.nombre_estado !== 'Cancelada' ? (
                <>
                  <Text style={styles.label}>Diagnóstico médico *</Text>
                  <TextInput
                    style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
                    placeholder="Escribe el diagnóstico de la consulta..."
                    multiline
                    value={diagnostico}
                    onChangeText={setDiagnostico}
                  />

                  <Text style={styles.label}>Tratamiento / Plan indicado</Text>
                  <TextInput
                    style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                    placeholder="Indicaciones o cuidados..."
                    multiline
                    value={tratamiento}
                    onChangeText={setTratamiento}
                  />

                  <Text style={styles.label}>Resultados de pruebas / Laboratorio</Text>
                  <TextInput
                    style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
                    placeholder="Ej. Biometría hemática normal, Glucosa 92 mg/dL..."
                    multiline
                    value={resultadosPruebas}
                    onChangeText={setResultadosPruebas}
                  />

                  <Action onPress={handleGuardarExpediente} disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar consulta y resultados'}
                  </Action>
                </>
              ) : (
                <>
                  <Text style={styles.label}>Diagnóstico</Text>
                  <Text style={styles.text}>{registroActual?.diagnostico || 'Aún no registrado por el médico.'}</Text>

                  <Text style={styles.label}>Tratamiento</Text>
                  <Text style={styles.text}>{registroActual?.tratamiento || 'Sin indicaciones adicionales.'}</Text>

                  <Text style={styles.label}>Resultados de pruebas</Text>
                  <Text style={styles.text}>
                    {registroActual?.resultados_pruebas || 'Sin resultados de laboratorio registrados.'}
                  </Text>
                </>
              )}
            </View>

            {/* 3. Receta Electrónica */}
            {cita.receta ? (
              <View style={styles.card}>
                <Text style={styles.title}>Receta Electrónica</Text>
                <Text style={styles.text}>{cita.receta.indicaciones_generales || 'Sin indicaciones generales'}</Text>
                {(cita.receta.detalles || []).map(item => (
                  <View key={item.id_detalle} style={{ marginTop: 10 }}>
                    <Text style={styles.label}>{item.medicamento?.nombre_medicamento || 'Medicamento'}</Text>
                    <Text style={styles.text}>
                      {[item.dosis, item.frecuencia, item.duracion].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                ))}
                <Action secondary onPress={() => router.push(`/recetas/${cita.receta.id_receta}`)}>
                  Ver receta completa
                </Action>
              </View>
            ) : null}

            {puedeRecetar ? (
              <Action onPress={() => router.push(`/recetas/crear?id_cita=${cita.id_cita}`)}>
                Emitir receta electrónica
              </Action>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </AccountPage>
  );
}