import React, { useContext } from 'react';
import { Stack } from 'expo-router';
import { UserContext, UserProvider } from '../../frontend/src/context/UserContext';

function Routes() {
  const { user } = useContext(UserContext);
  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Protected guard={!user}>
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
    </Stack.Protected>
    <Stack.Protected guard={!!user}>
      <Stack.Screen name="home" />
      <Stack.Screen name="medicos" />
    </Stack.Protected>
  </Stack>;
}
export default function Layout() {
  return <UserProvider><Routes /></UserProvider>;
}
