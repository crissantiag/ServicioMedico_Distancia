import React from 'react';
import { ScrollView, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { account } from '../services/account';
import { AccountPage, styles } from '../components/AccountUI';
import { RecetaFormulario } from '../components/RecetaFormulario';

export default function RecetaCrearScreen() {
  const { id_cita: idCita } = useLocalSearchParams();
  const valida = /^[1-9]\d*$/.test(String(idCita));
  return <AccountPage title="Nueva receta">
    {valida
      ? <RecetaFormulario
          subtitulo={`Cita número ${idCita}. El paciente y la fecha se toman de la cita.`}
          textoBoton="Emitir receta"
          onGuardar={async datos => {
            const { data } = await account.createPrescription({ id_cita: Number(idCita), ...datos });
            router.replace(`/recetas/${data.id_receta}`);
          }} />
      : <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.text}>Abre esta pantalla desde el detalle de una cita.</Text>
        </ScrollView>}
  </AccountPage>;
}
