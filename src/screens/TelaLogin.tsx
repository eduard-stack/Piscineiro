import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Platform
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth } from '../services/firebaseConfig'; // Caminho mantido

// Define o tipo de navegação (ajuste conforme suas rotas reais)
type RootStackParamList = {
  TelaInicio: undefined;
  TelaRecuperarSenha: undefined;
  TelaCadastro: undefined;
  MainTabs: undefined
};

const TelaLogin: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = () => {
    if (!email || !senha) {
      setError('Por favor, preencha todos os campos.');
      setTimeout(() => setError(''), 2000);
      return;
    }

    signInWithEmailAndPassword(auth, email, senha)
      .then(() => {
        navigation.navigate('MainTabs');
      })
      .catch((error) => {
        console.log('Erro de autenticação do Firebase:', error);

        let mensagem = '';
        switch (error.code) {
          case 'auth/invalid-email':
          case 'auth/invalid-credential':
          case 'auth/wrong-password':
          case 'auth/user-not-found':
            mensagem = 'E-mail ou senha inválidos.';
            break;
          case 'auth/network-request-failed':
            mensagem = 'Sem conexão com a internet.';
            break;
          default:
            mensagem = 'Erro ao tentar fazer login: ' + error.message;
        }

        Platform.OS === 'web'
          ? window.alert(mensagem)
          : Alert.alert('Erro de login', mensagem);
      });
  };

  const handleEsqueciSenha = () => {
    navigation.navigate('TelaRecuperarSenha');
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/logo_piscineiro.jpeg')} style={styles.logo} />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleEsqueciSenha}>
        <Text style={styles.esqueciSenhaText}>Esqueci minha senha</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('TelaCadastro')}>
        <Text style={styles.cadastroText}>Ainda não possui uma conta? <Text style={{ fontWeight: 'bold'}}> Cadastre-se</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  button: {
    width: '100%',
    height: 40,
    backgroundColor: 'blue',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  esqueciSenhaText: {
    color: 'blue',
    marginTop: 10,
  },
  cadastroText: {
    color: 'blue',
    marginTop: 10,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
});

export default TelaLogin;