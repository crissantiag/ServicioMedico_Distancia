import React, { useContext, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { UserContext } from '../context/UserContext';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isFocused1, setIsFocused1] = useState(false);
    const [isFocused2, setIsFocused2] = useState(false);
    
    const { setUser } = useContext(UserContext);
    const navigation = useNavigation();

    const handleLogin = () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert("Campos incompletos", "Por favor, completa todos los campos.");
            return;
        }

        setUser({ username });
        navigation.navigate('Main'); 
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            
            <View style={styles.logoContainer}>
                <Image 
                    source={require('../../../assets/logo.png')} 
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>
            
            <Text style={styles.title}>Iniciar Sesión</Text>

            <View style={[
                styles.inputContainer, 
                { borderWidth: isFocused1 ? 2.5 : 1.5, borderColor: isFocused1 ? '#3368A0' : '#66A3BF' }
            ]}>
                <MaterialCommunityIcons name="account" size={22} color="#66A3BF" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    onChangeText={setUsername}
                    value={username}
                    placeholder="Nombre de usuario"
                    placeholderTextColor="#888"
                    autoCapitalize="none"
                    onFocus={() => setIsFocused1(true)}
                    onBlur={() => setIsFocused1(false)}
                />
            </View>

            <View style={[
                styles.inputContainer, 
                { borderWidth: isFocused2 ? 2.5 : 1.5, borderColor: isFocused2 ? '#3368A0' : '#66A3BF' }
            ]}>
                <MaterialCommunityIcons name="lock" size={22} color="#66A3BF" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    onChangeText={setPassword}
                    value={password}
                    placeholder="Contraseña"
                    placeholderTextColor="#888"
                    secureTextEntry
                    autoCapitalize="none"
                    onFocus={() => setIsFocused2(true)}
                    onBlur={() => setIsFocused2(false)}
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin} activeOpacity={0.8}>
                <Text style={styles.buttonText}>Ingresar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}> 
                <Text style={styles.registerLinkText}>
                    ¿No tienes cuenta? <Text style={styles.registerLinkBold}>Regístrate aquí</Text>
                </Text> 
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2EFE7', 
    },
    contentContainer: {
        padding: 24,
        paddingTop: 100,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        marginVertical: 25,
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#3368A0', 
    },
    logoContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,       
        backgroundColor: '#FFFFFF', 
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3368A0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    logo: {
        width: 100,
        height: 100,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF', 
        borderRadius: 12,
        width: '100%',
        height: 55,
        paddingHorizontal: 16,
        marginVertical: 10,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#1b1b1b',
    },
    button: {
        width: '100%',
        backgroundColor: '#3368A0', 
        borderRadius: 12,
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#3368A0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 4,
    },
    buttonText: {
        color: '#FFFFFF', 
        fontWeight: 'bold',
        fontSize: 16,
    },
    registerLink: {
        marginTop: 25,
        padding: 10,
    },
    registerLinkText: {
        color: 'gray',
        fontSize: 15,
    },
    registerLinkBold: {
        color: '#3368A0',
        fontWeight: 'bold',
    },
});

export default LoginScreen;
