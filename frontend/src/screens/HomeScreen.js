import { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { UserContext } from '../context/UserContext';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const HomeScreen = () => {
   const { user, setUser } = useContext(UserContext); 
    const navigation = useNavigation();

    const handleLogout = () => {
        Alert.alert(
            "Cerrar Sesión",
            "¿Estás seguro de que deseas salir?",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Salir", 
                    style: "destructive",
                    onPress: () => {
                        setUser(null); 
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }], 
                        });
                    }
                }
            ]
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            
            <Text style={styles.title}>
                Bienvenido, {user?.username || 'Paciente'}
            </Text>

            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('')}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="calendar-clock" size={36} color="#3368A0" />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.cardTitle}>Citas</Text>
                    <Text style={styles.cardSubtitle}>Programa tu próxima cita médica</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('')}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="heart-pulse" size={36} color="#3368A0" />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.cardTitle}>Consultas</Text>
                    <Text style={styles.cardSubtitle}>Historial y detalles de tus atenciones</Text>
                </View>
            </TouchableOpacity>

            {/* Tarjeta Médicos */}
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('')}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="medical-bag" size={36} color="#3368A0" />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.cardTitle}>Médicos</Text>
                    <Text style={styles.cardSubtitle}>Encuentra al personal de salud disponible</Text>
                </View>
            </TouchableOpacity>

            {/* Tarjeta Recetas */}
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('')}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="pill" size={36} color="#3368A0" />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.cardTitle}>Recetas</Text>
                    <Text style={styles.cardSubtitle}>Revisa tus medicamentos prescritos</Text>
                </View>
            </TouchableOpacity>

            {/* Tarjeta Historial */}
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Historial')}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="clipboard-pulse" size={36} color="#3368A0" />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.cardTitle}>Historial Médico</Text>
                    <Text style={styles.cardSubtitle}>Tu expediente clínico digital completo</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                <MaterialCommunityIcons name="logout" size={24} color="#FFFFFF" style={styles.logoutIcon} />
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2EFE7' 
    },
    contentContainer: {
        padding: 20,
        paddingTop: 30,
        alignItems: 'center'
    },
    title: {
        fontSize: 28,
        marginBottom: 25,
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#3368A0' 
    },
    card: {
        width: '100%',
        backgroundColor: '#FFFFFF', 
        borderColor: '#66A3BF',     
        borderWidth: 1.5,
        borderRadius: 16,
        paddingVertical: 24,        
        paddingHorizontal: 20,      
        flexDirection: 'row',       
        alignItems: 'center',
        marginTop: 18,              
        shadowColor: '#3368A0',
        shadowOffset: { width: 0, height: 6 }, 
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4, 
    },
    iconContainer: {
        width: 60,                 
        height: 60,                
        borderRadius: 12,
        backgroundColor: '#E6F0FA', 
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 18,
    },
    textContainer: {
        flex: 1, 
    },
    cardTitle: {
        color: '#3368A0',            
        fontSize: 20,              
        fontWeight: 'bold',
    },
    cardSubtitle: {
        color: '#66A3BF', 
        fontSize: 14,               
        marginTop: 4,
    },
     logoutButton: {
        width: '100%',
        backgroundColor: '#BA3C2A', // Rojo elegante para peligro/salida
        borderRadius: 12,
        height: 55,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 35,
        marginBottom: 20,
        shadowColor: '#BA3C2A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
    },
    logoutIcon: {
        marginRight: 10
    },
    logoutText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default HomeScreen;
