import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, Platform } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../services/firebaseConfig'; // Importação ajustada

console.log('TelaLogin.js: Carregando firebaseConfig de ../services/firebaseConfig');

const TelaLogin = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!email || !senha) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
     
      signInWithEmailAndPassword(auth, email, senha)
      .then(() => {
        navigation.navigate('Principal'); // Navegação para a próxima tela
      })
      .catch((error) => {
        console.log("Erro de autenticação do Firebase:", error);
      
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
            break;
        }
      
        if (Platform.OS === 'web') {
          window.alert(mensagem);
        } else {
          Alert.alert('Erro de login', mensagem);
        }
      });
  
};

  const handleEsqueciSenha = () => {
    navigation.navigate('RecuperarSenha');
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo_piscineiro.jpeg')} style={styles.logo} />
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
      <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
        <Text style={styles.cadastroText}>Ainda não possui uma conta? Cadastre-se</Text>
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