import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import api from '../services/api'; // Tu servicio de conexión con Axios

export default function MedicosScreen({ navigation }) {
  const [medicos, setMedicos] = useState([]);
  const [filteredMedicos, setFilteredMedicos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Cargar lista inicial de médicos desde la API de Laravel
  useEffect(() => {
    fetchMedicos();
  }, []);

  const fetchMedicos = async () => {
    try {
      const response = await api.get('/medicos'); // Ruta en tu api.php de Laravel
      setMedicos(response.data);
      setFilteredMedicos(response.data);
    } catch (error) {
      console.error('Error al cargar médicos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función de filtrado dinámico por nombre o especialidad
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredMedicos(medicos);
    } else {
      const filtered = medicos.filter((medico) => {
        const nombreCompleto = `${medico.nombre} ${medico.apellido}`.toLowerCase();
        const especialidad = medico.especialidad?.nombre_especialidad?.toLowerCase() || '';
        const query = text.toLowerCase();

        return nombreCompleto.includes(query) || especialidad.includes(query);
      });
      setFilteredMedicos(filtered);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barra de Búsqueda y Filtros */}
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por nombre o especialidad..."
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={handleSearch}
      />

      {/* Listado de Médicos Filtrados */}
      <FlatList
        data={filteredMedicos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('CitaCrear', { medicoId: item.id })}
          >
            <View>
              <Text style={styles.medicoName}>Dr. {item.nombre} {item.apellido}</Text>
              <Text style={styles.especialidadText}>
                {item.especialidad?.nombre_especialidad || 'Medicina General'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No se encontraron médicos con ese criterio.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchInput: {
    height: 48,
    backgroundColor: '#fff',
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  medicoName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  especialidadText: { fontSize: 14, color: '#666', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 24, fontSize: 16 },
});