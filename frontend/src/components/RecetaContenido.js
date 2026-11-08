import React from 'react';
import { Text, View } from 'react-native';
import { styles } from './AccountUI';
import { fechaReceta, posologia } from '../utils/receta';

// El médico/administrador ve el nombre del paciente; el paciente, el del médico.
export function RecetaContenido({ receta, mostrarPaciente = false }) {
  const quien = mostrarPaciente
    ? receta.usuario?.nombre_completo || 'Paciente no disponible'
    : receta.cita?.medico?.nombre_completo || 'Médico no disponible';
  return <>
    <Text style={styles.badge}>Emitida el {fechaReceta(receta.fecha_emision)}</Text>
    <Text style={styles.title}>{quien}</Text>
    <Text style={styles.label}>Indicaciones generales</Text>
    <Text style={styles.text}>{receta.indicaciones_generales || 'Sin indicaciones generales'}</Text>
    <Text style={styles.label}>Medicamentos</Text>
    {(receta.detalles || []).length === 0 ? <Text style={styles.text}>Sin medicamentos registrados</Text> : null}
    {(receta.detalles || []).map(item => <View key={item.id_detalle} style={{ marginBottom: 8 }}>
      <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 0 }]}>{item.medicamento?.nombre_medicamento || 'Medicamento'}</Text>
      <Text style={styles.text}>{posologia(item)}</Text>
      {item.medicamento?.descripcion_basica ? <Text style={styles.muted}>{item.medicamento.descripcion_basica}</Text> : null}
    </View>)}
    <Text style={styles.muted}>Receta número {receta.id_receta}</Text>
  </>;
}
