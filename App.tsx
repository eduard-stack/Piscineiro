import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './src/services/firebaseConfig';

// Telas
import TelaLogin from './src/screens/TelaLogin';
import TelaCadastro from './src/screens/TelaCadastro';
import TelaRecuperarSenha from './src/screens/TelaRecuperarSenha';
import TelaValidacaoUser from './src/screens/TelaValidacaoUser';
import MainTabNavigator from './src/navigation/MainTabNavigator';

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
  } | undefined;
  MainTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (userAuth) => {
      setUser(userAuth);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="TelaLogin" component={TelaLogin} />
            <Stack.Screen name="TelaCadastro" component={TelaCadastro} />
            <Stack.Screen name="TelaRecuperarSenha" component={TelaRecuperarSenha} />
            <Stack.Screen name="TelaValidacaoUser" component={TelaValidacaoUser} />
          </>
        ) : user.emailVerified ? (
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        ) : (
          <>
            {/* Permite que usuário logado, mas sem e-mail verificado, acesse a validação */}
            <Stack.Screen name="TelaValidacaoUser" component={TelaValidacaoUser} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
