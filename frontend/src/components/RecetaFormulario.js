import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { account } from '../services/account';
import { useResource } from '../hooks/useResource';
import { Action, Feedback, styles } from './AccountUI';

const nuevoItem = () => ({ id_medicamento: '', dosis: '', frecuencia: '', duracion: '' });

// Formulario de receta. inicial = { indicaciones, items } al editar.
// onGuardar recibe { indicaciones_generales, medicamentos } y debe devolver una promesa.
export function RecetaFormulario({ subtitulo, inicial, textoBoton, onGuardar }) {
  const medicamentos = useResource(account.medications);
  const [indicaciones, setIndicaciones] = useState(inicial?.indicaciones || '');
  const [items, setItems] = useState(inicial?.items?.length ? inicial.items : [nuevoItem()]);
  const [saving, setSaving] = useState(false);

  const setItem = (index, cambios) =>
    setItems(lista => lista.map((item, i) => (i === index ? { ...item, ...cambios } : item)));
  const quitar = index => setItems(lista => lista.filter((_, i) => i !== index));

  const guardar = async () => {
    const incompleto = items.some(i => !i.id_medicamento || !i.dosis.trim() || !i.frecuencia.trim() || !i.duracion.trim());
    if (incompleto) return Alert.alert('Faltan datos', 'Completa medicamento, dosis, frecuencia y duración en cada medicamento.');
    const ids = items.map(i => i.id_medicamento);
    if (new Set(ids).size !== ids.length) return Alert.alert('Medicamento repetido', 'Cada medicamento solo puede aparecer una vez en la receta.');
    setSaving(true);
    try {
      await onGuardar({
        indicaciones_generales: indicaciones.trim() || null,
        medicamentos: items.map(i => ({
          id_medicamento: Number(i.id_medicamento),
          dosis: i.dosis.trim(),
          frecuencia: i.frecuencia.trim(),
          duracion: i.duracion.trim(),
        })),
      });
    } catch (error) {
      Alert.alert('No se pudo guardar la receta', error.message);
    } finally {
      setSaving(false);
    }
  };

  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    {subtitulo ? <Text style={styles.muted}>{subtitulo}</Text> : null}
    <Feedback loading={medicamentos.loading} error={medicamentos.error} retry={medicamentos.reload} />

    <Text style={styles.label}>Indicaciones generales (opcional)</Text>
    <TextInput style={[styles.input, { minHeight: 90, textAlignVertical: 'top', paddingTop: 10 }]} multiline
      value={indicaciones} onChangeText={setIndicaciones} maxLength={2000}
      placeholder="Ej. Reposo y abundantes líquidos" placeholderTextColor="#64748B" />

    {items.map((item, index) => <View key={index} style={styles.card}>
      <Text style={styles.title}>Medicamento {index + 1}</Text>
      <View style={[styles.input, { paddingHorizontal: 0 }]}>
        <Picker accessibilityLabel={`Medicamento ${index + 1}`} selectedValue={item.id_medicamento}
          onValueChange={value => setItem(index, { id_medicamento: value })}>
          <Picker.Item label="Selecciona un medicamento" value="" />
          {(medicamentos.data?.data || []).map(m =>
            <Picker.Item key={m.id_medicamento} label={m.nombre_medicamento} value={String(m.id_medicamento)} />)}
        </Picker>
      </View>
      <TextInput style={styles.input} value={item.dosis} maxLength={100} placeholder="Dosis (ej. 1 tableta)"
        placeholderTextColor="#64748B" onChangeText={value => setItem(index, { dosis: value })} />
      <TextInput style={styles.input} value={item.frecuencia} maxLength={100} placeholder="Frecuencia (ej. Cada 8 horas)"
        placeholderTextColor="#64748B" onChangeText={value => setItem(index, { frecuencia: value })} />
      <TextInput style={styles.input} value={item.duracion} maxLength={100} placeholder="Duración (ej. 5 días)"
        placeholderTextColor="#64748B" onChangeText={value => setItem(index, { duracion: value })} />
      {items.length > 1 ? <Action secondary onPress={() => quitar(index)}>Quitar medicamento</Action> : null}
    </View>)}

    {items.length < 20 ? <Action secondary onPress={() => setItems(lista => [...lista, nuevoItem()])}>+ Agregar otro medicamento</Action> : null}
    <Action disabled={saving || medicamentos.loading} onPress={guardar}>{saving ? 'Guardando…' : textoBoton}</Action>
  </ScrollView>;
}
