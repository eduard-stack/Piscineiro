import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import type { Prestador } from '../screens/TelaSearch'; // ajuste o caminho se necessário



// Telas
import TelaLogin from '../screens/TelaLogin';
import TelaCadastro from '../screens/TelaCadastro';
import TelaRecuperarSenha from '../screens/TelaRecuperarSenha';
import TelaValidacaoUser from '../screens/TelaValidacaoUser';
import MainTabNavigator from './MainTabNavigator';
import TelaPerfilPrestador from '../screens/TelaPerfilPrestador'; // ajuste o caminho conforme seu projeto



export type RootStackParamList = {
  TelaLogin: undefined;
  TelaCadastro: undefined;
  TelaRecuperarSenha: undefined;
  TelaValidacaoUser: {
    userData?: {
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
  TelaPerfilPrestador: { prestador: Prestador }; // ✅ Adicione esta linha
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const [user, setUser] = useState<User | null>(null);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('TelaLogin');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (userAuth) => {
      setUser(userAuth);
      if (userAuth) {
        if (userAuth.emailVerified) {
          setInitialRoute('MainTabs');
        } else {
          setInitialRoute('TelaValidacaoUser');
        }
      } else {
        setInitialRoute('TelaLogin');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    // Você pode exibir um SplashScreen ou componente de carregamento aqui
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
      <Stack.Screen name="TelaLogin" component={TelaLogin} />
      <Stack.Screen name="TelaCadastro" component={TelaCadastro} />
      <Stack.Screen name="TelaRecuperarSenha" component={TelaRecuperarSenha} />
      <Stack.Screen name="TelaValidacaoUser" component={TelaValidacaoUser} />
      <Stack.Screen name="TelaPerfilPrestador" component={TelaPerfilPrestador} />

      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
