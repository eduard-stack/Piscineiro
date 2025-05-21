import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { auth, db } from '../services/firebaseConfig';
import { reload, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import {
  useNavigation,
  useRoute,
  RouteProp,
  CommonActions,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type TelaValidacaoUserRouteProp = RouteProp<RootStackParamList, 'TelaValidacaoUser'>;
type TelaValidacaoUserNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'TelaLogin'
>;

export default function TelaValidacaoUser() {
  const route = useRoute<TelaValidacaoUserRouteProp>();
  const navigation = useNavigation<TelaValidacaoUserNavigationProp>();
  const userData = route.params?.userData;

  const [emailVerificado, setEmailVerificado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempo, setTempo] = useState(90);
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  useEffect(() => {
    checarVerificacao();
    const intervalId = setInterval(() => {
      checarVerificacao();
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (tempo === 0) return;
    const timer = setTimeout(() => setTempo((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [tempo]);

  const checarVerificacao = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await reload(user);
        setEmailVerificado(user.emailVerified);
      } catch (error) {
        console.error('[ERRO] Falha ao recarregar usuário:', error);
      }
    }
  };

  const reenviarEmail = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        setEnviandoEmail(true);
        await sendEmailVerification(user);
        Alert.alert('E-mail enviado', 'Um novo link de verificação foi enviado.');
        setTempo(90);
      } catch (error) {
        console.error('[REENVIO] Erro ao enviar e-mail:', error);
        Alert.alert('Erro', 'Não foi possível enviar o e-mail de verificação.');
      } finally {
        setEnviandoEmail(false);
      }
    }
  };

  const finalizarCadastro = async () => {
    setLoading(true);

    const user = auth.currentUser;

    if (!user || !userData) {
      Alert.alert('Atenção', 'Não foi possível recuperar dados do usuário.');
      setLoading(false);
      return;
    }

    try {
      await reload(user);

      if (!user.emailVerified) {
        Alert.alert('Atenção', 'Por favor, verifique seu e-mail antes de finalizar o cadastro.');
        setLoading(false);
        return;
      }

      const docRef = doc(db, 'usuarios', user.uid);
      await setDoc(docRef, {
        uid: user.uid,
        nome: userData.nome,
        cpf: userData.cpf,
        telefone: userData.telefone,
        email: userData.email,
        cep: userData.cep,
        rua: userData.rua,
        numero: userData.numero,
        complemento: userData.complemento,
        bairro: userData.bairro,
        cidade: userData.cidade,
        estado: userData.estado,
        semNumero: userData.semNumero,
      });

      await signOut(auth);

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'TelaLogin' }],
        })
      );

      Alert.alert('Cadastro finalizado', 'Seu cadastro foi concluído com sucesso!');
    } catch (error: any) {
      console.error('[CADASTRO] Erro:', error);
      const mensagem =
        error.code === 'permission-denied'
          ? 'Você não tem permissão para salvar esses dados.'
          : 'Não foi possível salvar seus dados.';
      Alert.alert('Erro', mensagem);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Valide seu e-mail</Text>
      <Text style={styles.texto}>
        Um link foi enviado para o e-mail cadastrado. Clique no link e retorne aqui para finalizar.
      </Text>

      {!emailVerificado ? (
        <>
          <TouchableOpacity
            style={[styles.botao, (tempo > 0 || enviandoEmail) && styles.botaoDesabilitado]}
            disabled={tempo > 0 || enviandoEmail}
            onPress={reenviarEmail}
          >
            {enviandoEmail ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.textoBotao}>Reenviar e-mail de verificação</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.cronometro}>⏳ {tempo}s</Text>
        </>
      ) : (
        <TouchableOpacity
          style={[styles.botao, loading && styles.botaoDesabilitado]}
          disabled={loading}
          onPress={finalizarCadastro}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.textoBotao}>Finalizar cadastro</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  titulo: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  texto: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  botao: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  botaoDesabilitado: {
    backgroundColor: '#999',
  },
  textoBotao: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cronometro: {
    textAlign: 'center',
    color: '#d00',
    fontWeight: 'bold',
    marginBottom: 8,
  },
});
