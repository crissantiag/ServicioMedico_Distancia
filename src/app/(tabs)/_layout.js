import React, { useContext } from 'react';                                   // useContext NUEVO
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificacionesContext } from '../../../frontend/src/context/NotificacionesContext';   // NUEVO

const PESTANAS = [
  { name: 'home', title: 'Inicio', icon: 'home' },
  { name: 'mis-citas', title: 'Mis citas', icon: 'calendar-month' },
  { name: 'notificaciones', title: 'Notificaciones', icon: 'bell' },
  { name: 'perfil', title: 'Perfil', icon: 'account-circle' },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { noLeidas } = useContext(NotificacionesContext);                    // NUEVO
  return <Tabs
    initialRouteName="home"
    screenOptions={{ /* ...igual que antes... */ }}
  >
    {PESTANAS.map(({ name, title, icon }) => <Tabs.Screen
      key={name}
      name={name}
      options={{
        title,
        // NUEVO: etiqueta accesible y globo con el contador
        tabBarAccessibilityLabel: name === 'notificaciones' && noLeidas > 0 ? `${title}, ${noLeidas} sin leer` : title,
        tabBarBadge: name === 'notificaciones' && noLeidas > 0 ? (noLeidas > 99 ? '99+' : noLeidas) : undefined,
        tabBarIcon: ({ color, size, focused }) =>
          <MaterialCommunityIcons name={focused ? icon : `${icon}-outline`} size={size + 2} color={color} />,
      }}
    />)}
  </Tabs>;
}