import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TelaLogin from './src/screens/TelaLogin';
import TelaPrincipal from './src/screens/TelaPrincipal';
import TelaRecuperarSenha from './src/screens/TelaRecuperarSenha';
import TelaCadastro from './src/screens/TelaCadastro';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={TelaLogin} options={{ headerShown: false }} />
        <Stack.Screen name="Principal" component={TelaPrincipal} options={{ headerShown: false }} />
        <Stack.Screen name="RecuperarSenha" component={TelaRecuperarSenha} options={{ headerShown: false }} />
        <Stack.Screen name="Cadastro" component={TelaCadastro} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );s
}