import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let tokenActual = null;

const esExpoGoAndroid = Platform.OS === 'android'
  && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;


export async function registrarDispositivoPush() {
  if (esExpoGoAndroid) return null;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Avisos',
        importance: Notifications.AndroidImportance.MAX,
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    await api.post('notificaciones/dispositivos', { token, plataforma: Platform.OS });
    tokenActual = token;
    return token;
  } catch (error) {
    console.warn('No se pudo activar las notificaciones push:', error.message);
    return null;
  }
}

// Se llama antes de cerrar sesión (después ya no hay token para hablar con la API).
export async function quitarDispositivoPush() {
  const token = tokenActual;
  tokenActual = null;
  if (!token) return;
  try {
    await Promise.race([
      api.post('notificaciones/dispositivos/eliminar', { token }),
      new Promise(resolve => setTimeout(resolve, 3000)),
    ]);
  } catch {
    // Cerrar sesión no debe depender de esto.
  }
}