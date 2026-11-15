import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';
import { registrationSpecialties } from '../services/auth';

const RegisterScreen = () => {
  const { signUp } = useContext(UserContext);

  const [rol, setRol] = useState('paciente');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [specialties, setSpecialties] = useState([]);
  const [specialty, setSpecialty] = useState('');
  const [focused, setFocused] = useState('');
  const [busy, setBusy] = useState(false);

  // Las especialidades se piden a Laravel (ruta pública) solo cuando se elige "Médico".
  useEffect(() => {
    if (rol !== 'medico' || specialties.length) return;
    registrationSpecialties()
      .then(list => setSpecialties(list || []))
      .catch(error => Alert.alert('Especialidades', error.message));
  }, [rol, specialties.length]);

  const border = name => ({
    borderWidth: focused === name ? 2.5 : 1.5,
    borderColor: focused === name ? '#3368A0' : '#66A3BF',
  });

  const handleRegister = async () => {
    const name = username.trim();
    const mail = email.trim();

    if (!name || !mail || !password) {
      Alert.alert('Campos incompletos', 'Por favor, completa todos los campos obligatorios.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      Alert.alert('Correo inválido', 'Introduce un formato de correo electrónico válido.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (rol === 'medico' && !specialty) {
      Alert.alert('Especialidad requerida', 'Selecciona tu especialidad.');
      return;
    }

    try {
      setBusy(true);
      // Crea la cuenta en Firebase y el perfil (rol/especialidad) en Laravel.
      // Al terminar, UserContext guarda el usuario y la app entra sola a las pantallas protegidas.
      await signUp(name, mail, password,
        rol === 'medico' ? { rol: 'medico', id_especialidad: Number(specialty) } : { rol: 'paciente' });
    } catch (error) {
      Alert.alert('Error de registro', error.message || 'No se pudo completar el registro.');
    } finally {
      setBusy(false);
    }
  };

  const goToLogin = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Crear Cuenta</Text>

      <View style={styles.roleRow}>
        {[
          ['paciente', 'Paciente', 'account-heart'],
          ['medico', 'Médico', 'stethoscope'],
        ].map(([value, label, icon]) => {
          const active = rol === value;
          return (
            <TouchableOpacity key={value} activeOpacity={0.8} onPress={() => setRol(value)}
              style={[styles.roleButton, active && styles.roleButtonActive]}>
              <MaterialCommunityIcons name={icon} size={26} color={active ? '#FFFFFF' : '#3368A0'} />
              <Text style={[styles.roleText, active && styles.roleTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.inputContainer, border('name')]}>
        <MaterialCommunityIcons name="account" size={22} color="#66A3BF" style={styles.icon} />
        <TextInput style={styles.input} value={username} onChangeText={setUsername}
          placeholder="Nombre de usuario" placeholderTextColor="#888"
          onFocus={() => setFocused('name')} onBlur={() => setFocused('')} />
      </View>

      <View style={[styles.inputContainer, border('email')]}>
        <MaterialCommunityIcons name="email" size={22} color="#66A3BF" style={styles.icon} />
        <TextInput style={styles.input} value={email} onChangeText={setEmail}
          placeholder="Correo electrónico" placeholderTextColor="#888"
          keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
          onFocus={() => setFocused('email')} onBlur={() => setFocused('')} />
      </View>

      <View style={[styles.inputContainer, border('password')]}>
        <MaterialCommunityIcons name="lock" size={22} color="#66A3BF" style={styles.icon} />
        <TextInput style={styles.input} value={password} onChangeText={setPassword}
          placeholder="Contraseña" placeholderTextColor="#888"
          secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false}
          onFocus={() => setFocused('password')} onBlur={() => setFocused('')} />
        <TouchableOpacity accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          onPress={() => setShowPassword(value => !value)}
          style={{ minWidth: 48, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color="#3368A0" />
        </TouchableOpacity>
      </View>

      {rol === 'medico' ? (
        <View style={[styles.inputContainer, border('specialty')]}>
          <MaterialCommunityIcons name="medical-bag" size={22} color="#66A3BF" style={styles.icon} />
          <Picker style={{ flex: 1 }} selectedValue={specialty} onValueChange={setSpecialty}
            onFocus={() => setFocused('specialty')} onBlur={() => setFocused('')}
            accessibilityLabel="Selecciona tu especialidad">
            <Picker.Item label="Selecciona tu especialidad" value="" />
            {specialties.map(item => (
              <Picker.Item key={item.id_especialidad} label={item.nombre_especialidad} value={String(item.id_especialidad)} />
            ))}
          </Picker>
        </View>
      ) : null}

      <TouchableOpacity style={styles.button} disabled={busy} onPress={handleRegister} activeOpacity={0.8}>
        {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Registrarse</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.registerLink} onPress={goToLogin}>
        <Text style={styles.registerLinkText}>
          ¿Ya tienes una cuenta? <Text style={styles.registerLinkBold}>Inicia sesión</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EFE7' },
  contentContainer: { padding: 24, paddingTop: 100, alignItems: 'center' },
  title: { fontSize: 32, marginVertical: 25, textAlign: 'center', fontWeight: 'bold', color: '#3368A0' },
  roleRow: { flexDirection: 'row', width: '100%', gap: 14, marginBottom: 10 },
  roleButton: {
    flex: 1, height: 70, borderRadius: 12, backgroundColor: '#FFFFFF',
    borderWidth: 1.5, borderColor: '#66A3BF', alignItems: 'center', justifyContent: 'center',
  },
  roleButtonActive: { backgroundColor: '#3368A0', borderColor: '#3368A0' },
  roleText: { marginTop: 2, fontSize: 16, fontWeight: '600', color: '#3368A0' },
  roleTextActive: { color: '#FFFFFF' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12,
    width: '100%', height: 55, paddingHorizontal: 16, marginVertical: 10,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, height: '100%', fontSize: 16, color: '#1b1b1b' },
  button: {
    width: '100%', backgroundColor: '#3368A0', borderRadius: 12, height: 55,
    justifyContent: 'center', alignItems: 'center', marginTop: 20,
    shadowColor: '#3368A0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 5, elevation: 4,
  },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  registerLink: { marginTop: 25, padding: 10 },
  registerLinkText: { color: 'gray', fontSize: 15 },
  registerLinkBold: { color: '#3368A0', fontWeight: 'bold' },
});

export default RegisterScreen;