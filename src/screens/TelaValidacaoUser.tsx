import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { auth, db } from '../services/firebaseConfig';
import { onAuthStateChanged, reload, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types'; // ajuste se o caminho for diferente

type ValidacaoUserRouteProp = RouteProp<RootStackParamList, 'TelaValidacaoUser'>;
type ValidacaoUserNavProp = NativeStackNavigationProp<RootStackParamList, 'TelaValidacaoUser'>;

const TelaValidacaoUser: React.FC = () => {
  const route = useRoute<ValidacaoUserRouteProp>();
  const navigation = useNavigation<ValidacaoUserNavProp>();
  const { userData } = route.params;

  const [emailVerificado, setEmailVerificado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [botaoHabilitado, setBotaoHabilitado] = useState(false);
  const [cronometro, setCronometro] = useState(0);
  const intervaloRef = useRef<NodeJS.Timeout | null>(null);
  const cronometroRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usuario) => {
      if (usuario) {
        await reload(usuario);
        if (usuario.emailVerified) {
          setEmailVerificado(true);
          setBotaoHabilitado(true);
        }
      }
      setCarregando(false);
    });

    intervaloRef.current = setInterval(async () => {
      const user = auth.currentUser;
      if (user) {
        await reload(user);
        if (user.emailVerified) {
          setEmailVerificado(true);
          setBotaoHabilitado(true);
          clearInterval(intervaloRef.current!);
        }
      }
    }, 5000);

    return () => {
      unsubscribe();
      if (intervaloRef.current) clearInterval(intervaloRef.current);
      if (cronometroRef.current) clearInterval(cronometroRef.current);
    };
  }, []);

  const handleFinalizarCadastro = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    try {
      const userInfo = {
        ...userData,
        emailVerificado: true,
        uid: user.uid,
      };

      await setDoc(doc(db, 'usuarios', user.uid), userInfo);

      Alert.alert('Sucesso!', 'Cadastro realizado com sucesso!');
      navigation.navigate('TelaLogin');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível finalizar o cadastro.');
    }
  };

  const handleReenviarEmail = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    try {
      await sendEmailVerification(user);
      Alert.alert('E-mail enviado', 'Verifique sua caixa de entrada.');

      setCronometro(180);
      cronometroRef.current = setInterval(() => {
        setCronometro((prev) => {
          if (prev <= 1 && cronometroRef.current) {
            clearInterval(cronometroRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível enviar o e-mail.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Verifique seu e-mail</Text>
      <Text style={styles.mensagem}>
        Enviamos um link de verificação para o seu e-mail. Por favor, clique no link e retorne para esta tela.
      </Text>

      {carregando ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : (
        <TouchableOpacity
          style={[
            styles.botao,
            { backgroundColor: botaoHabilitado ? '#007BFF' : '#ccc' },
          ]}
          disabled={!botaoHabilitado}
          onPress={handleFinalizarCadastro}
        >
          <Text style={styles.botaoTexto}>Cadastrar</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          styles.botaoSecundario,
          { backgroundColor: cronometro > 0 ? '#ccc' : '#007BFF' },
        ]}
        disabled={cronometro > 0}
        onPress={handleReenviarEmail}
      >
        <Text style={styles.botaoTexto}>
          {cronometro > 0
            ? `Aguarde ${Math.floor(cronometro / 60)}:${String(cronometro % 60).padStart(2, '0')}`
            : 'Enviar e-mail de verificação novamente'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#007BFF',
    textAlign: 'center',
  },
  mensagem: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  botao: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  botaoSecundario: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TelaValidacaoUser;
