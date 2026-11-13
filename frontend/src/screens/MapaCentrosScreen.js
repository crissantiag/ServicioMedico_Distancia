import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../services/api';

export default function MapaCentrosScreen() {
  const router = useRouter();
  const [centros, setCentros] = useState([]);
  const [centroSeleccionado, setCentroSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarCentros();
  }, []);

  const cargarCentros = async () => {
    try {
      const response = await api.get('centros-medicos');
      const lista = Array.isArray(response.data) ? response.data : (response.data?.data || []);

      const validos = lista.filter((c) => c.latitud !== null && c.longitud !== null);
      setCentros(validos);

      if (validos.length > 0) {
        setCentroSeleccionado(validos[0]);
      }
    } catch (error) {
      console.error('Error al cargar centros en el mapa:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerMedicosDelCentro = (centro) => {
    const idCentro = String(centro.id_centro || centro.id);
    router.push({
      pathname: '/medicos',
      params: { id_centro: idCentro },
    });
  };

  // HTML con Leaflet que pinta los pines y notifica a React Native al tocar un marcador
  const leafletHtml = useMemo(() => {
    const latInicial = centros.length > 0 ? parseFloat(centros[0].latitud) : 19.432607;
    const lngInicial = centros.length > 0 ? parseFloat(centros[0].longitud) : -99.133208;
    const marcadoresJson = JSON.stringify(
      centros.map((c) => ({
        id: c.id_centro || c.id,
        nombre: c.nombre_centro,
        direccion: c.direccion || '',
        lat: parseFloat(c.latitud),
        lng: parseFloat(c.longitud),
      }))
    );

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            const map = L.map('map').setView([${latInicial}, ${lngInicial}], 12);

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            const centros = ${marcadoresJson};
            const bounds = [];

            centros.forEach((centro, index) => {
              const marker = L.marker([centro.lat, centro.lng]).addTo(map);
              marker.bindPopup('<b>' + centro.nombre + '</b><br>' + centro.direccion);

              if (index === 0) {
                marker.openPopup();
              }

              marker.on('click', () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ id_centro: centro.id }));
              });

              bounds.push([centro.lat, centro.lng]);
            });

            if (bounds.length > 1) {
              map.fitBounds(bounds, { padding: [40, 40] });
            }
          </script>
        </body>
      </html>
    `;
  }, [centros]);

  const handleMensajeMapa = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.id_centro) {
        const encontrado = centros.find(
          (c) => String(c.id_centro || c.id) === String(data.id_centro)
        );
        if (encontrado) {
          setCentroSeleccionado(encontrado);
        }
      }
    } catch (e) {
      console.warn('Error leyendo evento del mapa:', e);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3368A0" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3368A0" barStyle="light-content" />

      {/* Barra Superior */}
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mapa de Centros Médicos</Text>
      </View>

      {/* Mapa Interactivo con Leaflet */}
      <View style={styles.mapContainer}>
        <WebView
          originWhitelist={['*']}
          source={{ html: leafletHtml }}
          style={styles.map}
          javaScriptEnabled
          domStorageEnabled
          onMessage={handleMensajeMapa}
        />
      </View>

      {/* Tarjeta inferior con detalles del centro y lista de médicos */}
      {centroSeleccionado && (
        <View style={styles.bottomCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.centroTitle}>{centroSeleccionado.nombre_centro}</Text>
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>
                {centroSeleccionado.medicos?.length || 0} médicos
              </Text>
            </View>
          </View>

          <Text style={styles.centroInfo}>📍 {centroSeleccionado.direccion}</Text>
          {centroSeleccionado.telefono_contacto && (
            <Text style={styles.centroInfo}>📞 Tel: {centroSeleccionado.telefono_contacto}</Text>
          )}

          <Text style={styles.sectionLabel}>Médicos que atienden aquí:</Text>
          <ScrollView style={styles.medicosList} nestedScrollEnabled>
            {centroSeleccionado.medicos && centroSeleccionado.medicos.length > 0 ? (
              centroSeleccionado.medicos.map((med) => (
                <Text key={String(med.id_medico)} style={styles.medicoRow}>
                  • <Text style={{ fontWeight: '600' }}>{med.nombre_completo}</Text>
                  {med.especialidad ? ` — ${med.especialidad.nombre_especialidad}` : ''}
                </Text>
              ))
            ) : (
              <Text style={styles.emptyMedicos}>No hay médicos asignados a este centro.</Text>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.btnVerMedicos}
            onPress={() => handleVerMedicosDelCentro(centroSeleccionado)}
          >
            <Ionicons name="people-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.btnVerMedicosText}>Ver tarjetas de médicos de este centro</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EFE7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topAppBar: {
    height: 56,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    elevation: 3,
  },
  iconButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginLeft: 10 },
  mapContainer: { flex: 1 },
  map: { flex: 1, backgroundColor: 'transparent' },
  bottomCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    maxHeight: '45%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  centroTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', flex: 1 },
  badgeCount: {
    backgroundColor: '#C8DFDB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeCountText: { color: '#3368A0', fontSize: 12, fontWeight: '700' },
  centroInfo: { fontSize: 13, color: '#64748B', marginTop: 2 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#3368A0', marginTop: 10, marginBottom: 4 },
  medicosList: { maxHeight: 80, marginBottom: 12 },
  medicoRow: { fontSize: 13, color: '#334155', marginBottom: 3 },
  emptyMedicos: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },
  btnVerMedicos: {
    backgroundColor: '#3368A0',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnVerMedicosText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
});