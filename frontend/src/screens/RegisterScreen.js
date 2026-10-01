import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 

const RegisterScreen = () => {
    const navigation = useNavigation();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = () => {
        if (!username || !email || !password) {
            Alert.alert('Error', 'Por favor, llena todos los campos.');
            return;
        }
        Alert.alert('Éxito', 'Cuenta creada correctamente', [
            { text: 'Ir al Login', onPress: () => navigation.navigate('Login') }
        ]);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Regístrate en la clínica pediátrica</Text>

            <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="account" size={20} color="#66A3BF" style={styles.icon} />
                <TextInput 
                    style={styles.input} 
                    placeholder="Nombre de usuario" 
                    placeholderTextColor="#999"
                    value={username}
                    onChangeText={setUsername}
                />
            </View>

            <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="email" size={20} color="#66A3BF" style={styles.icon} />
                <TextInput 
                    style={styles.input} 
                    placeholder="Correo electrónico" 
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />
            </View>

            <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="lock" size={20} color="#66A3BF" style={styles.icon} />
                <TextInput 
                    style={styles.input} 
                    placeholder="Contraseña" 
                    placeholderTextColor="#999"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Registrarse</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLinkText}>
                    ¿Ya tienes una cuenta? <Text style={styles.loginLinkBold}>Inicia sesión</Text>
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2EFE7', justifyContent: 'center', alignItems: 'center', padding: 24 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#3368A0', marginBottom: 8 },
    subtitle: { fontSize: 16, color: 'gray', marginBottom: 32 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#66A3BF', borderRadius: 12, width: '100%', height: 55, paddingHorizontal: 15, marginBottom: 16 },
    icon: { marginRight: 10 },
    input: { flex: 1, color: '#333', fontSize: 16 },
    button: { width: '100%', backgroundColor: '#3368A0', borderRadius: 12, height: 55, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    loginLink: { marginTop: 25, padding: 10 },
    loginLinkText: { color: 'gray', fontSize: 15 },
    loginLinkBold: { color: '#3368A0', fontWeight: 'bold' }
});

export default RegisterScreen; 