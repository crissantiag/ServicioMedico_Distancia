import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../services/api';

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

  useEffect(() => {
    cargarMedicos();
  }, []);

  const cargarMedicos = async () => {
    try {
      const response = await api.get('medicos');
      const listaMedicos = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.data || response || []);

      setMedicos(listaMedicos);

      // Ahora params ya estará definido y no dará ReferenceError
      if (params?.id_medico) {
        setMedicoSeleccionado(String(params.id_medico));
      }
    } catch (error) {
      console.error('Error al cargar médicos:', error);
      Alert.alert('Error', 'No se pudo cargar la lista de médicos disponibles.');
    } finally {
      setLoadingData(false);
    }
  };

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
    if (!medicoSeleccionado) {
      Alert.alert('Atención', 'Por favor seleccione un médico.');
      return;
    }

    setLoading(true);
    try {
      // Formato YYYY-MM-DD HH:mm:ss requerido por Laravel (after:now)
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
        motivo_consulta: motivoConsulta.trim() || null,
      };

      await api.post('citas', payload);

      Alert.alert('¡Éxito!', 'Cita agendada correctamente.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      // Si la API devuelve un error 422 (Día o hora no permitida para ese médico) o 409 (Ocupado)
      if (error.status === 409 || error.response?.status === 409) {
        Alert.alert('Horario Ocupado', 'El médico ya tiene una cita agendada en ese horario.');
      } else {
        const mensaje = error.message || error.response?.data?.message || 'No se pudo agendar la cita.';
        Alert.alert('Horario no disponible', mensaje);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  // Buscar el médico seleccionado para mostrar su disponibilidad de forma informativa
  const medicoActual = medicos.find(m => (m.id_medico || m.id) === parseInt(medicoSeleccionado, 10));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.padding}>
      <Text style={styles.title}>Agendar Cita Médica</Text>

      {/* Desplegable de Médicos */}
      <Text style={styles.label}>Seleccionar Médico *</Text>
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
        label={`${nombreMostrar} ${especialidadMostrar ? `- ${especialidadMostrar}` : ''}`} 
        value={itemKey} // El valor debe ser una string que coincida con medicoSeleccionado
      />
    );
  })}
</Picker>
      </View>

      {/* Mostrar información de disponibilidad del médico seleccionado */}
      {medicoActual?.disponibilidad && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            📅 <Text style={{ fontWeight: 'bold' }}>Disponibilidad:</Text> {medicoActual.disponibilidad}
          </Text>
        </View>
      )}

      {/* Selectores de Fecha y Hora */}
      <Text style={styles.label}>Fecha y Hora de Atención *</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.selectorBtn} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.selectorText}>{fecha.toLocaleDateString()}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.selectorBtn} onPress={() => setShowTimePicker(true)}>
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

      {/* Campo de Motivo */}
      <Text style={styles.label}>Motivo de la Consulta</Text>
      <TextInput
        style={styles.inputArea}
        placeholder="Describa brevemente el motivo..."
        multiline
        numberOfLines={3}
        value={motivoConsulta}
        onChangeText={setMotivoConsulta}
      />

      {/* Botón de Enviar */}
      <TouchableOpacity 
        style={[styles.submitBtn, loading && styles.disabledBtn]} 
        onPress={handleGuardarCita}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitText}>Confirmar y Agendar</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  padding: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginTop: 14, marginBottom: 6 },
  pickerBox: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1' },
  infoBox: { backgroundColor: '#E0F2FE', padding: 10, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#BAE6FD' },
  infoText: { color: '#0369A1', fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  selectorBtn: { flex: 0.48, backgroundColor: '#FFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' },
  selectorText: { fontSize: 14, color: '#1E293B' },
  inputArea: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', padding: 12, textAlignVertical: 'top', fontSize: 14 },
  submitBtn: { backgroundColor: '#0284C7', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  disabledBtn: { backgroundColor: '#94A3B8' },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});