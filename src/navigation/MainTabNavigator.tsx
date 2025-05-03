
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';

// Telas (algumas ainda são placeholders)
import TelaPrincipal from '../screens/TelaPrincipal';
import TelaLogout from '../screens/TelaLogout'; // usado temporariamente para Favoritos e Perfil

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 70,
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          borderRadius: 35,
          backgroundColor: '#fff',
          elevation: 5,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Inicio') iconName = 'home';
          else if (route.name === 'Buscar') iconName = 'search';
          else if (route.name === 'Agendar') iconName = 'calendar';
          else if (route.name === 'Favoritos') iconName = 'heart';
          else if (route.name === 'Perfil') iconName = 'person';

          // Ícone flutuante especial para a aba "Agendar"
          if (route.name === 'Agendar') {
            return (
              <View style={styles.floatingButtonContainer}>
                <TouchableOpacity activeOpacity={0.8} style={styles.floatingButton}>
                  <Ionicons name={iconName} size={30} color="blue" />
                </TouchableOpacity>
              </View>
            );
          }

          // Ícone com imagem de perfil
          if (route.name === 'Perfil') {
            return (
              <Image
                source={{ uri: 'https://via.placeholder.com/30' }} // Substituir por foto do usuário futuramente
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  borderColor: focused ? 'blue' : 'gray',
                  borderWidth: 2,
                }}
              />
            );
          }

          // Ícones padrão
          return <Ionicons name={iconName} size={24} color={focused ? 'blue' : 'black'} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={TelaPrincipal} />
      <Tab.Screen name="Buscar" component={TelaPrincipal} />
      <Tab.Screen name="Agendar" component={TelaPrincipal} />
      <Tab.Screen name="Favoritos" component={TelaLogout} />
      <Tab.Screen name="Perfil" component={TelaLogout} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  floatingButtonContainer: {
    top: -20, // sobe o botão
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    borderWidth: 2,
    borderColor: 'blue',
  },
});


