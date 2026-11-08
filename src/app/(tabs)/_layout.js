import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PESTANAS = [
  { name: 'home', title: 'Inicio', icon: 'home' },
  { name: 'mis-citas', title: 'Mis citas', icon: 'calendar-month' },
  { name: 'notificaciones', title: 'Notificaciones', icon: 'bell' },
  { name: 'perfil', title: 'Perfil', icon: 'account-circle' },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return <Tabs
    initialRouteName="home"
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#1F2A44',
      tabBarInactiveTintColor: '#A3ABBA',
      tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopColor: '#E2E8F0',
        height: 62 + insets.bottom,
        paddingTop: 6,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
      },
    }}
  >
    {PESTANAS.map(({ name, title, icon }) => <Tabs.Screen
      key={name}
      name={name}
      options={{
        title,
        tabBarAccessibilityLabel: title,
        tabBarIcon: ({ color, size, focused }) =>
          <MaterialCommunityIcons name={focused ? icon : `${icon}-outline`} size={size + 2} color={color} />,
      }}
    />)}
  </Tabs>;
}