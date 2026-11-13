import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../services/api';
import { AccountPage, Action, Feedback } from '../components/AccountUI';

export default function CitaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [medicos, setMedicos] = useState([]);
  const [medicoSeleccionado, setMedicoSeleccionado] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [motivoConsulta, setMotivoConsulta] = useState('');
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [reload, setReload] = useState(0);
  const medicoInicial = params?.id_medico;
  useEffect(() => {
    let active = true;
    const cargarMedicos = async () => {
      try {
        const response = await api.get('medicos');
        if (!active) return;
        setMedicos(response.data);
        if (medicoInicial) setMedicoSeleccionado(String(medicoInicial));
      } catch (error) {
        if (active) Alert.alert('Error', error.message);
      } finally {
        if (active) setLoadingData(false);
      }
    };
    void Promise.resolve().then(cargarMedicos);
    return () => { active = false; };
  }, [medicoInicial, reload]);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const current = new Date(fecha);
      current.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setFecha(current);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const current = new Date(fecha);
      current.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0);
      setFecha(current);
    }
  };

  const handleGuardarCita = async () => {
    // 1. Validar que todos los campos estén completos
    if (!medicoSeleccionado) {
      Alert.alert('Campos incompletos', 'Por favor, selecciona un médico para la cita.');
      return;
    }

    if (!motivoConsulta.trim()) {
      Alert.alert('Campos incompletos', 'Por favor, describe el motivo de la consulta.');
      return;
    }

    // 2. Validar que la fecha y hora sean futuras (en español)
    const ahora = new Date();
    if (fecha <= ahora) {
      Alert.alert(
        'Fecha u hora inválida',
        'La fecha y hora de la cita deben ser posteriores al momento actual.'
      );
      return;
    }

    setLoading(true);
    try {
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      const hours = String(fecha.getHours()).padStart(2, '0');
      const minutes = String(fecha.getMinutes()).padStart(2, '0');
      const seconds = '00';

      const fechaFormateada = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      const payload = {
        id_medico: parseInt(medicoSeleccionado, 10),
        fecha_hora: fechaFormateada,
        motivo_consulta: motivoConsulta.trim(),
      };

      await api.post('citas', payload);

      Alert.alert('¡Éxito!', 'Cita agendada correctamente.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      if (error.status === 409 || error.response?.status === 409) {
        Alert.alert('Horario ocupado', 'El médico ya tiene una cita agendada en ese horario.');
      } else {
        let mensaje = error.message || error.response?.data?.message || 'No se pudo agendar la cita.';
        
        // Traducción de respaldo por si Laravel devuelve la validación en inglés
        if (mensaje.toLowerCase().includes('must be a date after now')) {
          mensaje = 'La fecha y hora de la cita deben ser posteriores al momento actual.';
        }

        Alert.alert('Horario no disponible', mensaje);
      }
    } finally {
      setLoading(false);
    }
  };

  const medicoActual = medicos.find(m => String(m.id_medico || m.id) === String(medicoSeleccionado));

  return (
    <AccountPage title="Agendar cita">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Feedback loading={loadingData} error="" retry={() => setReload(value => value + 1)} />

        {!loadingData ? (
          <View style={styles.card}>
            <View style={styles.encabezado}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="calendar-clock" size={32} color="#3368A0" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Programa tu cita</Text>
                <Text style={styles.cardSubtitle}>Elige médico, fecha y hora</Text>
              </View>
            </View>

            {/* Médico */}
            <Text style={styles.label}>Seleccionar médico *</Text>
            <View style={styles.pickerBox}>
              <Picker
                selectedValue={String(medicoSeleccionado)}
                onValueChange={(val) => setMedicoSeleccionado(String(val))}
              >
                <Picker.Item label="Seleccione un médico..." value="" />
                {medicos.map((item) => {
                  const itemKey = String(item.id_medico || item.id);
                  const nombreMostrar = item.nombre_completo ||
                    (item.usuario ? item.usuario.nombre_completo : null) ||
                    'Médico';
                  const especialidadMostrar = item.especialidad?.nombre_especialidad || '';
                  return (
                    <Picker.Item
                      key={itemKey}
                      label={`${nombreMostrar}${especialidadMostrar ? ` - ${especialidadMostrar}` : ''}`}
                      value={itemKey}
                    />
                  );
                })}
              </Picker>
            </View>

            {medicoActual?.disponibilidad ? (
              <View style={styles.infoBox}>
                <MaterialCommunityIcons name="clock-outline" size={20} color="#24517E" style={{ marginRight: 8 }} />
                <Text style={styles.infoText}>
                  <Text style={{ fontWeight: 'bold' }}>Disponibilidad: </Text>
                  {medicoActual.disponibilidad}
                </Text>
              </View>
            ) : null}

            {/* Fecha y hora */}
            <Text style={styles.label}>Fecha y hora de atención *</Text>
            <View style={styles.row}>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Elegir fecha"
                style={styles.selectorBtn} onPress={() => setShowDatePicker(true)}>
                <MaterialCommunityIcons name="calendar" size={20} color="#3368A0" />
                <Text style={styles.selectorText}>
                  {fecha.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Elegir hora"
                style={styles.selectorBtn} onPress={() => setShowTimePicker(true)}>
                <MaterialCommunityIcons name="clock-outline" size={20} color="#3368A0" />
                <Text style={styles.selectorText}>
                  {fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={fecha}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={handleDateChange}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={fecha}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}

            {/* Motivo */}
            <Text style={styles.label}>Motivo de la consulta *</Text>
            <TextInput
              style={styles.inputArea}
              placeholder="Describa brevemente el motivo..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
              maxLength={1000}
              value={motivoConsulta}
              onChangeText={setMotivoConsulta}
            />

            <Action onPress={handleGuardarCita} disabled={loading}>
              {loading ? 'Agendando…' : 'Confirmar y agendar'}
            </Action>
          </View>
        ) : null}
      </ScrollView>
    </AccountPage>
  );
}

const styles = StyleSheet.create(
{
  content: { 
    padding: 20, 
    paddingBottom: 35 
  },
  card: {
    backgroundColor: '#FFFFFF', 
    borderColor: '#66A3BF', 
    borderWidth: 1.5, 
    borderRadius: 16,
    padding: 20,
    shadowColor: '#3368A0', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 6, 
    elevation: 4,
  },
  encabezado: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 6 
  },
  iconBox: {
    width: 60, 
    height: 60, 
    borderRadius: 12, 
    backgroundColor: '#E6F0FA',
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16,
  },
  cardTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#3368A0' 
  },
  cardSubtitle: { 
    fontSize: 14, 
    color: '#66A3BF', 
    marginTop: 2 
  },
  label: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: '#334155', 
    marginTop: 18, 
    marginBottom: 6 
  },
  pickerBox: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#94AFC5' 
  },
  infoBox: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#E6F0FA',
    padding: 12, 
    borderRadius: 10, 
    marginTop: 10,
  },
  infoText: { 
    flex: 1, 
    color: '#24517E', 
    fontSize: 14, 
    lineHeight: 20 
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    gap: 10 
  },
  selectorBtn: {
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8,
    backgroundColor: '#FFFFFF', 
    minHeight: 48, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#94AFC5',
  },
  selectorText: { 
    fontSize: 15, 
    color: '#1E293B' 
  },
  inputArea: {
    backgroundColor: '#FFFFFF', 
    color: '#1E293B', 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#94AFC5',
    padding: 12, 
    minHeight: 90, 
    textAlignVertical: 'top', 
    fontSize: 16, 
    marginBottom: 6,
  },
});