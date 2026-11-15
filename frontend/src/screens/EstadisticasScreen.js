import React, { useCallback } from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { api } from '../services/api';
import { useResource } from '../hooks/useResource';
import { AccountPage, Feedback, styles } from '../components/AccountUI';

const screenWidth = Dimensions.get('window').width - 72;

export default function EstadisticasScreen() {
  const load = useCallback(() => api.get('estadisticas/resumen'), []);
  const res = useResource(load);
  const datos = res.data?.data;

  const coloresPie = ['#3368A0', '#16A34A', '#DC2626', '#D97706', '#7C3AED'];

  const dataPie = (datos?.citas_por_estado || []).map((item, idx) => ({
    name: item.estado,
    population: Number(item.total),
    color: coloresPie[idx % coloresPie.length],
    legendFontColor: '#334155',
    legendFontSize: 13,
  }));

  const medsLabels = (datos?.medicamentos_top || []).map(m => m.nombre.slice(0, 10));
  const medsValues = (datos?.medicamentos_top || []).map(m => Number(m.total));

  return (
    <AccountPage title="Estadísticas y Gráficas">
      <ScrollView contentContainerStyle={styles.content}>
        <Feedback loading={res.loading && !datos} error={res.error} retry={res.reload} />

        {datos ? (
          <>
            {/* Tarjetas resumen */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.card, { flex: 1, alignItems: 'center' }]}>
                <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#3368A0' }}>
                  {datos.total_pacientes}
                </Text>
                <Text style={styles.muted}>Pacientes atendidos</Text>
              </View>
              <View style={[styles.card, { flex: 1, alignItems: 'center' }]}>
                <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#0F766E' }}>
                  {datos.total_consultas}
                </Text>
                <Text style={styles.muted}>Consultas totales</Text>
              </View>
            </View>

            {/* Gráfica 1: Distribución de Citas por Estado */}
            <View style={styles.card}>
              <Text style={styles.title}>Estado de Consultas</Text>
              {dataPie.length > 0 ? (
                <PieChart
                  data={dataPie}
                  width={screenWidth}
                  height={190}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="10"
                  chartConfig={{
                    color: (opacity = 1) => `rgba(51, 104, 160, ${opacity})`,
                  }}
                />
              ) : (
                <Text style={styles.muted}>Sin datos de consultas todavía.</Text>
              )}
            </View>

            {/* Gráfica 2: Medicamentos más recetados */}
            <View style={styles.card}>
              <Text style={styles.title}>Medicamentos más Recetados</Text>
              {medsValues.length > 0 ? (
                <BarChart
                  data={{
                    labels: medsLabels,
                    datasets: [{ data: medsValues }],
                  }}
                  width={screenWidth}
                  height={220}
                  fromZero
                  showValuesOnTopOfBars
                  chartConfig={{
                    backgroundColor: '#FFFFFF',
                    backgroundGradientFrom: '#FFFFFF',
                    backgroundGradientTo: '#FFFFFF',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(51, 104, 160, ${opacity})`,
                    labelColor: () => '#334155',
                  }}
                  style={{ borderRadius: 12, marginTop: 8 }}
                />
              ) : (
                <Text style={styles.muted}>Aún no hay recetas emitidas para graficar.</Text>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </AccountPage>
  );
}