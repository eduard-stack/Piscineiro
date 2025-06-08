// src/screens/TelaLogin.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { signInWithEmailAndPassword, sendEmailVerification, AuthErrorCodes, signOut } from 'firebase/auth'; // Importar AuthErrorCodes
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth } from '../services/firebaseConfig';

type RootStackParamList = {
  TelaRecuperarSenha: undefined;
  TelaCadastro: undefined;
  MainTabs: undefined;
};

const TelaLogin: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!email || !senha) {
      setError('Por favor, preencha todos os campos.');
      setTimeout(() => setError(''), 3000); 
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log("--- TENTANDO LOGIN ---");
      console.log("Email de login:", email);

      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      console.log("LOGIN BEM SUCEDIDO NO FIREBASE AUTH!");
      console.log("User UID:", user.uid);
      console.log("User Email:", user.email);
      console.log("User Email Verified STATUS RETORNADO PELO FIREBASE:", user.emailVerified); // <--- O MAIS IMPORTANTE

      // É importante forçar o reload para ter o status mais atualizado,
      // especialmente se o status de verificação foi alterado em outro lugar
      // (ex: o usuário clicou no link em outro dispositivo/navegador).
      try {
        await user.reload();
        console.log("APÓS RELOAD: User Email Verified STATUS:", user.emailVerified);
      } catch (reloadError: any) {
        console.error("Erro ao recarregar status do usuário:", reloadError);
        Alert.alert("Erro", "Não foi possível verificar o status da sua conta. Por favor, tente novamente.");
        await signOut(auth); // Desloga se não conseguir recarregar o status
        return; 
      }

      // Agora fazemos a verificação rigorosa
      if (!user.emailVerified) {
        console.log("BARREIRA ATIVADA: E-mail NÃO verificado.");
        Alert.alert(
          "E-mail Não Verificado",
          "Seu e-mail ainda não foi verificado. Por favor, clique no link enviado para o seu e-mail para verificar sua conta antes de fazer login.",
          [
            { 
              text: "Reenviar Link", 
              onPress: async () => {
                try {
                  if (user) {
                    await sendEmailVerification(user);
                    Alert.alert("Link Reenviado", "Um novo link de verificação foi enviado para o seu e-mail.");
                  }
                } catch (sendError: any) {
                    // Se falhar ao reenviar o link, exibe um alerta
                  Alert.alert("Erro", "Não foi possível reenviar o link de verificação: ");
                   console.log("Erro ao reenviar link de verificação:", sendError);
                }
              }
            },
            { text: "OK", style: "cancel" }
          ]
        );
        // Não navega para a tela principal
      } else {
        console.log("E-mail VERIFICADO. Navegando para MainTabs.");
        console.log("Login Sucesso", "Bem-vindo!");
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          })
        );
      }
    } catch (error: any) {
      console.log('Erro de autenticação do Firebase (catch):', error.code, error.message);

      let mensagem = '';
      switch (error.code) {
        case AuthErrorCodes.INVALID_EMAIL:
        case AuthErrorCodes.INVALID_APP_CREDENTIAL:
        case "auth/wrong-password":
        case AuthErrorCodes.USER_DELETED:
          mensagem = 'E-mail ou senha inválidos.';
          break;
        case AuthErrorCodes.NETWORK_REQUEST_FAILED:
          mensagem = 'Sem conexão com a internet. Verifique sua conexão e tente novamente.';
          break;
        case "auth/too-many-requests":
          mensagem = 'Muitas tentativas de login. Tente novamente mais tarde.';
          break;
        default:
          mensagem = 'Erro ao tentar fazer login: ' + error.message;
      }

      Platform.OS === 'web'
        ? window.alert(mensagem)
        : Alert.alert('Erro de Login', mensagem);
    } finally {
      setLoading(false);
      console.log("--- FIM DA TENTATIVA DE LOGIN ---");
    }
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
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleLogin} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
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
    textAlign: 'center',
  },
});

export default TelaLogin;