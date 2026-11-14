import React, { useState, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  Alert, 
  ActivityIndicator,
  ScrollView 
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
// Si manejas un contexto de usuario, lo mantenemos disponible:
// import { UserContext } from '../context/UserContext'; 

export default function RegisterScreen({ navigation }) {
  // Manteniendo exactamente tus estados originales
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Agregado por seguridad para verificar claves
  const [showPassword, setShowPassword] = useState(false);
  const [rol, setRol] = useState('paciente');
  const [specialties, setSpecialties] = useState([]);
  const [specialty, setSpecialty] = useState('');

  const handleRegister = async () => {
    // 1. Validaciones seguras para evitar que la app falle
    if (!username?.trim() || !email?.trim() || !password || !confirmPassword) {
      Alert.alert('Campos incompletos', 'Por favor, completa todos los campos obligatorios.');
      return;
    }

    // 2. Validación de formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Correo inválido', 'Introduce un formato de correo electrónico válido.');
      return;
    }

    // 3. Validación de contraseña mínima de Firebase (6 caracteres)
    if (password.length < 6) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // 4. Validación de coincidencia
    if (password !== confirmPassword) {
      Alert.alert('Contraseñas no coinciden', 'Por favor verifica que ambas claves sean iguales.');
      return;
    }

    try {
      setBusy(true);

      // Creación del usuario en Firebase Auth
      await createUserWithEmailAndPassword(auth, email.trim(), password);

      Alert.alert(
        '¡Registro exitoso!', 
        'Tu cuenta ha sido creada correctamente.', 
        [
          { 
            text: 'Aceptar', 
            onPress: () => navigation.goBack() // Regresa al login o pantalla anterior
          }
        ]
      );

    } catch (error) {
      let mensaje = 'No se pudo completar el registro.';
      if (error.code === 'auth/email-already-in-use') {
        mensaje = 'Este correo electrónico ya está registrado.';
      } else if (error.code === 'auth/invalid-email') {
        mensaje = 'El correo electrónico no es válido.';
      } else if (error.code === 'auth/weak-password') {
        mensaje = 'La contraseña es demasiado débil.';
      }
      Alert.alert('Error de registro', mensaje);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>

      {/* Campo de Nombre / Usuario */}
      <TextInput
        style={styles.input}
        placeholder="Nombre de usuario"
        placeholderTextColor="#aaa"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      
      {/* Campo de Correo */}
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#aaa"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      
      {/* Campo de Contraseña */}
      <TextInput
        style={styles.input}
        placeholder="Contraseña (mínimo 6 caracteres)"
        placeholderTextColor="#aaa"
        secureTextEntry={!showPassword}
        value={password}
        onChangeText={setPassword}
      />

      {/* Campo de Confirmar Contraseña */}
      <TextInput
        style={styles.input}
        placeholder="Confirmar contraseña"
        placeholderTextColor="#aaa"
        secureTextEntry={!showPassword}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {/* Botón de Registro */}
      <TouchableOpacity 
        style={[styles.button, busy && styles.buttonDisabled]} 
        onPress={handleRegister}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Registrarse</Text>
        )}
      </TouchableOpacity>

      {/* Enlace para volver al Login */}
      <TouchableOpacity 
        style={styles.linkContainer} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.linkText}>¿Ya tienes una cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    padding: 20, 
    backgroundColor: '#fff' 
  },
  title: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    marginBottom: 24, 
    textAlign: 'center', 
    color: '#333' 
  },
  input: { 
    height: 50, 
    borderColor: '#ddd', 
    borderWidth: 1, 
    borderRadius: 8, 
    marginBottom: 16, 
    paddingHorizontal: 16, 
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    color: '#333'
  },
  button: { 
    backgroundColor: '#007BFF', 
    height: 50, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 8, 
    marginTop: 8 
  },
  buttonDisabled: {
    backgroundColor: '#99c2ff',
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#007BFF',
    fontSize: 14,
  }
});