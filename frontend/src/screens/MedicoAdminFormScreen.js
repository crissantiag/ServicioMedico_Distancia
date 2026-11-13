import React, { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import { medicosAdmin, medicoForm, medicoPayload, validateMedico } from '../services/medicosAdmin';
import { useResource } from '../hooks/useResource';
import { AccountPage, Action, Feedback, styles } from '../components/AccountUI';
import MedicosAdminAccess from '../components/MedicosAdminAccess';

function Form({ medico, specialties, centers, id }) {
  const [form, setForm] = useState(() => medicoForm(medico));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const availableCenters = centers.filter(centro => !form.centros.includes(String(centro.id_centro)));
  const change = (field, value) => {
    setForm(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: '' }));
  };
  const save = async () => {
    if (saving.current) return;
    const validation = validateMedico(form);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    saving.current = true;
    setBusy(true);
    setError('');
    try {
      const payload = medicoPayload(form);
      if (id) await medicosAdmin.update(id, payload);
      else await medicosAdmin.create(payload);
      if (router.canGoBack()) router.back();
      else router.replace('/admin-medicos');
    } catch (failure) {
      setError(failure.message);
      setErrors(failure.errors || {});
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  const fieldError = field => errors[field] ? <Text style={styles.error}>{[].concat(errors[field]).join(' ')}</Text> : null;
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {id ? <Text style={styles.muted}>Médico #{id}{medico.id_usuario ? ' · Vinculado a una cuenta médica' : ''}</Text> : null}
      <Text style={styles.text}>Nombre y especialidad son obligatorios. Puedes asignar uno o varios centros médicos.</Text>
      <View style={styles.field}>
        <Text nativeID="medico-nombre" style={styles.label}>Nombre completo</Text>
        <TextInput accessibilityLabel="Nombre completo" style={styles.input} editable={!busy} maxLength={150}
          value={form.nombre_completo} onChangeText={value => change('nombre_completo', value)} />
        {fieldError('nombre_completo')}
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Especialidad</Text>
        <Picker accessibilityLabel="Especialidad" enabled={!busy} selectedValue={form.id_especialidad} onValueChange={value => change('id_especialidad', value)}>
          <Picker.Item label="Selecciona una especialidad" value="" />
          {specialties.map(item => <Picker.Item key={item.id_especialidad} label={item.nombre_especialidad} value={String(item.id_especialidad)} />)}
        </Picker>
        {fieldError('id_especialidad')}
        {!specialties.length ? <Text style={styles.error}>No hay especialidades disponibles. Registra una desde la administración web antes de continuar.</Text> : null}
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Centros médicos (opcional)</Text>
        {availableCenters.length ? <Picker accessibilityLabel="Agregar centro médico" enabled={!busy} selectedValue=""
          onValueChange={value => {
            if (value && !form.centros.includes(value)) change('centros', [...form.centros, value]);
          }}>
          <Picker.Item label="Selecciona un centro para agregarlo" value="" />
          {availableCenters.map(centro =>
            <Picker.Item key={centro.id_centro} label={centro.nombre_centro} value={String(centro.id_centro)} />)}
        </Picker> : centers.length ? <Text accessibilityRole="alert" style={styles.muted}>Ya agregaste todos los centros disponibles.</Text> : null}
        {form.centros.map(centroId => {
          const centro = centers.find(item => String(item.id_centro) === centroId);
          return <View key={centroId} style={[styles.card, { marginBottom: 8 }]}>
            <Text style={styles.text}>{centro?.nombre_centro || `Centro #${centroId}`}</Text>
            {centro?.direccion ? <Text style={styles.muted}>{centro.direccion}</Text> : null}
            <Action secondary disabled={busy} onPress={() => change('centros', form.centros.filter(value => value !== centroId))}>Quitar asignación</Action>
          </View>;
        })}
        {!form.centros.length ? <Text style={styles.muted}>Sin centro asignado.</Text> : null}
        {!centers.length ? <Text style={styles.muted}>No hay centros disponibles. Puedes guardar el perfil y asignarlos después.</Text> : null}
        <Text style={styles.muted}>Las asignaciones se actualizan al guardar. Los horarios de los centros que conserves no cambian.</Text>
        {fieldError('centros')}
        {Object.entries(errors).filter(([key]) => key.startsWith('centros.')).map(([key, value]) =>
          <Text key={key} style={styles.error}>{[].concat(value).join(' ')}</Text>)}
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Disponibilidad (opcional)</Text>
        <TextInput accessibilityLabel="Disponibilidad" style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]} editable={!busy} multiline maxLength={255}
          placeholder="Lunes a viernes, de 8:00 a 12:00" value={form.disponibilidad} onChangeText={value => change('disponibilidad', value)} />
        {fieldError('disponibilidad')}
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Action disabled={busy || !specialties.length} onPress={save}>{busy ? 'Guardando…' : id ? 'Guardar cambios' : 'Crear médico'}</Action>
      <Action secondary disabled={busy} onPress={() => router.canGoBack() ? router.back() : router.replace('/admin-medicos')}>Cancelar</Action>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function LoadedForm({ id }) {
  const load = useCallback(async () => {
    const [specialties, centers, response] = await Promise.all([
      medicosAdmin.specialties(), medicosAdmin.centers(), id ? medicosAdmin.detail(id) : Promise.resolve({ data: {} }),
    ]);
    return { specialties, centers, medico: response.data };
  }, [id]);
  const result = useResource(load);
  return <AccountPage title={id ? 'Editar médico' : 'Nuevo médico'}>
    {result.loading || result.error ? <Feedback loading={result.loading} error={result.error} retry={result.reload} />
      : <Form key={id || 'nuevo'} id={id} medico={result.data.medico} specialties={result.data.specialties} centers={result.data.centers} />}
  </AccountPage>;
}

export default function MedicoAdminFormScreen({ creating = false }) {
  const { id } = useLocalSearchParams();
  return <MedicosAdminAccess><LoadedForm id={creating ? null : id} /></MedicosAdminAccess>;
}
