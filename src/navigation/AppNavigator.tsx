import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TelaLogin from '../screens/TelaLogin';
import TelaCadastro from '../screens/TelaCadastro';
import TelaRecuperarSenha from '../screens/TelaRecuperarSenha';
import TelaValidacaoUser from '../screens/TelaValidacaoUser';
import MainTabNavigator from './MainTabNavigator';

export type RootStackParamList = {
  TelaLogin: undefined;
  TelaCadastro: undefined;
  TelaRecuperarSenha: undefined;
  TelaValidacaoUser: {
    userData: {
      uid: string;
      nome: string;
      cpf: string;
      telefone: string;
      email: string;
      cep: string;
      rua: string;
      numero: string;
      complemento: string;
      bairro: string;
      cidade: string;
      estado: string;
      semNumero: boolean;
    };
  };
  MainTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="TelaLogin" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TelaLogin" component={TelaLogin} />
      <Stack.Screen name="TelaCadastro" component={TelaCadastro} />
      <Stack.Screen name="TelaRecuperarSenha" component={TelaRecuperarSenha} />
      <Stack.Screen name="TelaValidacaoUser" component={TelaValidacaoUser} />
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
