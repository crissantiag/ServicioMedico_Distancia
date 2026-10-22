import React, { useState, useEffect } from 'react';
import {
  Alert,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { api } from '../services/api';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

export default function DoctorFilterScreen() {
  // Estados para los filtros seleccionados (IDs)
  const [idEspecialidad, setIdEspecialidad] = useState('');
  const [idCentro, setIdCentro] = useState('');
  const [idioma, setIdioma] = useState('');

  // Estados para llenar dinámicamente los selectores
  const [listaEspecialidades, setListaEspecialidades] = useState([]);
  const [listaCentros, setListaCentros] = useState([]);

  // Estados de datos y carga
  const [medicos, setMedicos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const fetchCatalogos = async () => {
    setLoadingCatalogos(true);
    try {
      const [especialidades, centros] = await Promise.all([
        api.get('especialidades'), api.get('centros-medicos'),
      ]);
      setListaEspecialidades(especialidades.data);
      setListaCentros(centros.data);
    } catch (failure) { setError(failure.message); }
    finally { setLoadingCatalogos(false); }
  };
  const fetchMedicos = async (nextPage = 1) => {
    setLoading(true);
    setError('');
    try {
      const result = await api.get('medicos', {
        id_especialidad: idEspecialidad, id_centro: idCentro,
        idioma, per_page: 15, page: nextPage,
      });
      setMedicos(result.data);
      setPage(nextPage);
      setLastPage(result.meta?.last_page || 1);
    } catch (failure) { setError(failure.message); setMedicos([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    // Carga inicial; los filtros se aplican solo al pulsar Buscar.
    void Promise.resolve().then(() => { fetchCatalogos(); fetchMedicos(1); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderDoctorCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.doctorName}>{item.nombre_completo || item.name}</Text>
        <Text style={styles.badge}>{item.especialidad?.nombre_especialidad || `Esp. ID: ${item.id_especialidad}`}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="business-outline" size={16} color="#3368A0" style={{ marginRight: 6 }} />
        <Text style={styles.cardInfo}>Centro: {item.centros?.map(centro => centro.nombre_centro).join(', ') || 'Sin centro asignado'}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="language-outline" size={16} color="#3368A0" style={{ marginRight: 6 }} />
        <Text style={styles.cardInfo}>Idioma: {item.idioma || 'No especificado'}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={16} color="#3368A0" style={{ marginRight: 6 }} />
        <Text style={styles.cardInfo}>Disponibilidad: {item.disponibilidad || 'Consultar horario'}</Text>
      </View>

      <TouchableOpacity style={styles.btnAgendar} onPress={() => Alert.alert('En preparación', 'La agenda todavía no está conectada.')}>
        <Text style={styles.btnAgendarText}>Agendar Cita</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3368A0" barStyle="light-content" />
      
      {/* Barra superior limpia con flecha a la izquierda */}
      <View style={styles.topAppBar}>
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Búsqueda de Médicos</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.headerSubtitle}>Filtra por especialidad, centro e idioma</Text>

        {loadingCatalogos ? (
          <ActivityIndicator size="small" color="#3368A0" style={{ marginVertical: 10 }} />
        ) : (
          <View style={styles.filterContainer}>
            
            {/* Selector Especialidades */}
            <Text style={styles.label}>Especialidad</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={idEspecialidad}
                onValueChange={(itemValue) => setIdEspecialidad(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Todas las especialidades" value="" />
                {listaEspecialidades.map((esp) => (
                  <Picker.Item 
                    key={esp.id || esp.id_especialidad} 
                    label={esp.nombre_especialidad || esp.nombre} 
                    value={String(esp.id || esp.id_especialidad)} 
                  />
                ))}
              </Picker>
            </View>

            {/* Selector Centros Médicos */}
            <Text style={styles.label}>Centro Médico / Ubicación</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={idCentro}
                onValueChange={(itemValue) => setIdCentro(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Todos los centros" value="" />
                {listaCentros.map((centro) => (
                  <Picker.Item 
                    key={centro.id || centro.id_centro} 
                    label={`${centro.nombre_centro} (${centro.direccion || ''})`} 
                    value={String(centro.id || centro.id_centro)} 
                  />
                ))}
              </Picker>
            </View>

            {/* Selector Idioma */}
            <Text style={styles.label}>Idioma</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={idioma}
                onValueChange={(itemValue) => setIdioma(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Cualquier idioma" value="" />
                <Picker.Item label="Español" value="Español" />
                <Picker.Item label="Inglés" value="Inglés" />
                <Picker.Item label="Francés" value="Francés" />
              </Picker>
            </View>

            <TouchableOpacity style={styles.btnFilter} disabled={loading} onPress={() => fetchMedicos(1)}>
              <Text style={styles.btnFilterText}>Buscar Médicos</Text>
            </TouchableOpacity>
          </View>
        )}

        {error ? <View accessibilityRole="alert"><Text style={{ color: '#B42318' }}>{error}</Text>
          <TouchableOpacity onPress={() => { fetchCatalogos(); fetchMedicos(1); }}><Text>Reintentar</Text></TouchableOpacity>
        </View> : null}
        <Text style={styles.resultsTitle}>Resultados de la Búsqueda</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#3368A0" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={medicos}
            keyExtractor={(item) => item.id?.toString() || item.id_medico?.toString() || Math.random().toString()}
            renderItem={renderDoctorCard}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{error ? 'No se pudo cargar la búsqueda.' : 'No se encontraron médicos con esos criterios.'}</Text>
            }
          />
        )}
        {!loading && lastPage > 1 ? <View>
          <Text>Página {page} de {lastPage}</Text>
          <TouchableOpacity disabled={page <= 1} onPress={() => fetchMedicos(page - 1)}><Text>Anterior</Text></TouchableOpacity>
          <TouchableOpacity disabled={page >= lastPage} onPress={() => fetchMedicos(page + 1)}><Text>Siguiente</Text></TouchableOpacity>
        </View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F2EFE7',
  },
  topAppBar: {
    height: 60,
    backgroundColor: '#FFFFFF', // Fondo blanco limpio como en tu captura
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    elevation: 2, // Sombra suave en Android
    shadowColor: '#000', // Sombra en iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 10,
  },
  iconButton: {
    padding: 8,
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1E293B', // Texto oscuro elegante
    marginLeft: 10,   // Separación limpia respecto a la flecha
  },
  headerSubtitle: { 
    fontSize: 13, 
    color: '#64748B', 
    marginTop: 15,
    marginBottom: 10,
    fontWeight: '500',
  },
  scrollContainer: { 
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  filterContainer: { 
    backgroundColor: '#FFFFFF', 
    padding: 15, 
    borderRadius: 12, 
    elevation: 3, 
    marginBottom: 20 
  },
  label: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#1E293B', 
    marginBottom: 4, 
    marginTop: 8 
  },
  pickerWrapper: { 
    backgroundColor: '#F2EFE7', 
    borderColor: '#C8DFDB', 
    borderWidth: 1, 
    borderRadius: 8, 
    overflow: 'hidden' 
  },
  picker: { 
    height: 50, 
    width: '100%', 
    color: '#1E293B' 
  },
  btnFilter: { 
    backgroundColor: '#66A3BF', 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 15 
  },
  btnFilterText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold', 
    fontSize: 15 
  },
  resultsTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1E293B', 
    marginBottom: 10 
  },
  card: { 
    backgroundColor: '#FFFFFF', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 12, 
    borderLeftWidth: 5, 
    borderLeftColor: '#3368A0', 
    elevation: 2 
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  doctorName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#1E293B' 
  },
  badge: { 
    backgroundColor: '#C8DFDB', 
    color: '#3368A0', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6, 
    fontSize: 12, 
    fontWeight: '600' 
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardInfo: { 
    fontSize: 13, 
    color: '#64748B' 
  },
  btnAgendar: { 
    backgroundColor: '#3368A0', 
    paddingVertical: 8, 
    borderRadius: 6, 
    alignItems: 'center', 
    marginTop: 10 
  },
  btnAgendarText: { 
    color: '#FFFFFF', 
    fontSize: 13, 
    fontWeight: 'bold' 
  },
  emptyText: { 
    textAlign: 'center', 
    color: '#64748B', 
    marginTop: 10, 
    fontSize: 14, 
    marginBottom: 20 
  },
});