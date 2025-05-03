import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Definindo os tipos da navegação (ajuste conforme seu arquivo de rotas)
type RootStackParamList = {
  TelaLogin: undefined;
  Inicio: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Inicio'>;

const TelaPrincipal: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        console.log('Usuário deslogado com sucesso.');
        
      })
      .catch((error) => {
        console.error('Erro ao deslogar:', error);
        Alert.alert('Erro ao Deslogar', error.message);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.texto}>
        Bem-vindo, cliente! Esta página está em manutenção.  (Página inicial)
      </Text>
      <TouchableOpacity style={styles.botao} onPress={handleLogout}>
        <Text style={styles.textoBotao}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  texto: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  botao: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  textoBotao: {
    color: '#fff',
    fontSize: 16,
  },
});

export default TelaPrincipal;
