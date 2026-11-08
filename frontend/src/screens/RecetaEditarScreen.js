import React, { useCallback } from 'react';
import { ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { account } from '../services/account';
import { useResource } from '../hooks/useResource';
import { AccountPage, Feedback, styles } from '../components/AccountUI';
import { RecetaFormulario } from '../components/RecetaFormulario';

export default function RecetaEditarScreen() {
  const { id } = useLocalSearchParams();
  const load = useCallback(() => account.prescription(id), [id]);
  const result = useResource(load);
  const receta = result.data?.data;
  return <AccountPage title="Editar receta">
    {receta
      ? <RecetaFormulario
          key={receta.id_receta}
          subtitulo={`Receta número ${receta.id_receta}. Los cambios reemplazan la lista de medicamentos.`}
          textoBoton="Guardar cambios"
          inicial={{
            indicaciones: receta.indicaciones_generales || '',
            items: (receta.detalles || []).map(d => ({
              id_medicamento: String(d.id_medicamento),
              dosis: d.dosis || '',
              frecuencia: d.frecuencia || '',
              duracion: d.duracion || '',
            })),
          }}
          onGuardar={async datos => {
            await account.updatePrescription(id, datos);
            if (router.canGoBack()) router.back(); else router.replace(`/recetas/${id}`);
          }} />
      : <ScrollView contentContainerStyle={styles.content}>
          <Feedback loading={result.loading} error={result.error} retry={result.reload} />
        </ScrollView>}
  </AccountPage>;
}
