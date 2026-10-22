import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import HomeScreen from './frontend/src/screens/HomeScreen';


const Tab = createBottomTabNavigator(); 

const AppTabs = () => (
    <Tab.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: '#eaeeffff' },
            headerTintColor: '#005187',
            headerTitleStyle: { fontWeight: 'bold' },
            
            tabBarStyle: { backgroundColor: '#ffffff', height: 60, paddingBottom: 8 },
            tabBarActiveTintColor: '#005187',  
            tabBarInactiveTintColor: '#999999',
        }}
    >
        <Tab.Screen name='Inicio' component={HomeScreen}
            options={{
                tabBarIcon: ({ color, size }) => (
                    <MaterialCommunityIcons name="home" size={size} color={color} />
                ),
            }}
        />

    </Tab.Navigator>
);

export default AppTabs;
