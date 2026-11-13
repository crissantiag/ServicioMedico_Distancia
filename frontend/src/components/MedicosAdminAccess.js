import React, { useContext } from 'react';
import { Text, View } from 'react-native';
import { UserContext } from '../context/UserContext';
import { AccountPage, styles } from './AccountUI';

export default function MedicosAdminAccess({ children }) {
  const { user } = useContext(UserContext);
  if (user?.rol !== 'administrador') {
    return <AccountPage title="Administrar médicos"><View style={styles.content}>
      <Text style={styles.text}>Este módulo requiere una cuenta administradora.</Text>
    </View></AccountPage>;
  }
  return children;
}
