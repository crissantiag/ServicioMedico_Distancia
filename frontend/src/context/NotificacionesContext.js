import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { UserContext } from './UserContext';
import { notificaciones, rutaDeNotificacion } from '../services/notifications';
import { registrarDispositivoPush } from '../services/push';

export const NotificacionesContext = createContext({ noLeidas: 0, refrescar: () => {} });

let ultimaAtendida = null;


export function NotificacionesProvider({ children }) {
  const { user } = useContext(UserContext);
  const idUsuario = user?.id_usuario;
  const [noLeidas, setNoLeidas] = useState(0);
  const ultimaRespuesta = Notifications.useLastNotificationResponse();

  const refrescar = useCallback(async () => {
    if (!idUsuario) return;
    try {
      setNoLeidas(await notificaciones.contador());
    } catch {
      // El contador es informativo: si falla, se conserva el último valor.
    }
  }, [idUsuario]);

  useEffect(() => {
    if (!idUsuario) {
      setNoLeidas(0);
      return undefined;
    }
    refrescar();
    registrarDispositivoPush();
    const intervalo = setInterval(refrescar, 60000);
    const recibida = Notifications.addNotificationReceivedListener(() => refrescar());
    return () => {
      clearInterval(intervalo);
      recibida.remove();
    };
  }, [idUsuario, refrescar]);

  useEffect(() => {
    const solicitud = ultimaRespuesta?.notification?.request;
    if (!idUsuario || !solicitud || solicitud.identifier === ultimaAtendida) return;
    ultimaAtendida = solicitud.identifier;
    refrescar();
    const ruta = rutaDeNotificacion(solicitud.content?.data) ?? '/notificaciones';
    setTimeout(() => {
      try { router.push(ruta); } catch { /* la pantalla ya no existe */ }
    }, 300);
  }, [ultimaRespuesta, idUsuario, refrescar]);

  const valor = useMemo(() => ({ noLeidas, refrescar }), [noLeidas, refrescar]);
  return <NotificacionesContext.Provider value={valor}>{children}</NotificacionesContext.Provider>;
}