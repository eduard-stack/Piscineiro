import React from 'react';
import {
  createBottomTabNavigator,
  BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';

import { useNavigationState } from '@react-navigation/native';

import TelaPrincipal from '../screens/TelaPrincipal';
import TelaLogout from '../screens/TelaLogout';
import TelaSearch from '../screens/TelaSearch'; // ajuste o caminho conforme sua pasta
import TelaMeusAgendamentos from '../screens/TelaMeusAgendamentos'; // ajuste o caminho conforme sua pasta
import TelaFavoritos from '../screens/TelaFavoritos';
import TelaPerfilUsuario from '../screens/TelaPerfilUsuario'; // ajuste o caminho conforme sua pasta


const Tab = createBottomTabNavigator();

function CustomAgendarButton({ onPress }: BottomTabBarButtonProps) {
  // Obtemos o estado da navegação para saber se estamos na aba "MeusAgendamentos"
  const selected = useNavigationState((state) => {
    const currentRoute = state.routes[state.index];
    return currentRoute.name === 'MeusAgendamentos';
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.floatingButtonContainer}
    >
      <View
        style={[
          styles.floatingButton,
          {
            borderColor: selected ? 'blue' : 'gray',
            shadowColor: selected ? 'blue' : '#000',
            elevation: selected ? 10 : 8,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 5,
          },
        ]}
      >
        <Ionicons
          name="calendar"
          size={27}
          color={selected ? 'blue' : 'black'}
        />
      </View>
    </TouchableOpacity>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 50,
          position: 'absolute',
          bottom: 1,
          left: 16,
          right: 16,
          borderRadius: 35,
          backgroundColor: '#fff',
          elevation: 5,
        },
        tabBarIcon: ({ focused }) => {
          if (route.name === 'MeusAgendamentos') return null;

          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Inicio') iconName = 'home';
          else if (route.name === 'Buscar') iconName = 'search';
          else if (route.name === 'Favoritos') iconName = 'heart';

          if (route.name === 'Perfil') {
            return (
              <Image
                source={{ uri: 'https://via.placeholder.com/30' }}
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

          return <Ionicons name={iconName} size={24} color={focused ? 'blue' : 'black'} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={TelaPrincipal} />
      <Tab.Screen name="Buscar" component={TelaSearch} />

      <Tab.Screen
        name="MeusAgendamentos"
        component={TelaMeusAgendamentos}
        options={{
          tabBarButton: (props) => <CustomAgendarButton {...props} />,
        }}
      />

      <Tab.Screen name="Favoritos" component={TelaFavoritos} />
      <Tab.Screen name="Perfil" component={TelaPerfilUsuario} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  floatingButtonContainer: {
    top: -15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  floatingButton: {
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
});
