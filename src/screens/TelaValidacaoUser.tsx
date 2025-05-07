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
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Import getDoc
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/Types';

type ValidacaoUserNavProp = NativeStackNavigationProp<RootStackParamList, 'TelaValidacaoUser'>;

const TelaValidacaoUser: React.FC = () => {
  console.log('TelaValidacaoUser: Componente montado');
  const navigation = useNavigation<ValidacaoUserNavProp>();

  const [emailVerificado, setEmailVerificado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [botaoHabilitado, setBotaoHabilitado] = useState(false);
  const [cronometro, setCronometro] = useState(0);
  const [userData, setUserData] = useState<any>(null); // Estado para os dados do usuário
  const intervaloRef = useRef<NodeJS.Timeout | null>(null);
  const cronometroRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('TelaValidacaoUser: useEffect onAuthStateChanged iniciado');
    const unsubscribe = onAuthStateChanged(auth, async (usuario) => {
      console.log('TelaValidacaoUser: onAuthStateChanged callback executado', usuario);
      if (usuario) {
        console.log('TelaValidacaoUser: onAuthStateChanged - Usuário encontrado, recarregando...');
        await reload(usuario);
        console.log('TelaValidacaoUser: onAuthStateChanged - Usuário recarregado, emailVerificado:', usuario.emailVerified);
        if (usuario.emailVerified) {
          console.log('TelaValidacaoUser: onAuthStateChanged - E-mail verificado!');
          setEmailVerificado(true);
          setBotaoHabilitado(true);
          clearInterval(intervaloRef.current!);

          // Buscar os dados do usuário do Firestore
          const userDoc = await getDoc(doc(db, 'usuarios', usuario.uid));
          if (userDoc.exists()) {
            console.log('TelaValidacaoUser: onAuthStateChanged - Dados do usuário recuperados:', userDoc.data());
            setUserData(userDoc.data());
          } else {
            console.log('TelaValidacaoUser: onAuthStateChanged - Dados do usuário não encontrados no Firestore.');
            Alert.alert('Erro', 'Dados do usuário não encontrados.');
            // Talvez redirecionar para a tela de login ou cadastro novamente
          }
        } else {
          console.log('TelaValidacaoUser: onAuthStateChanged - E-mail AINDA não verificado.');
        }
      } else {
        console.log('TelaValidacaoUser: onAuthStateChanged - Nenhum usuário autenticado.');
        setCarregando(false); // Se não houver usuário, não precisa carregar indefinidamente
      }
      setCarregando(false);
    });

    intervaloRef.current = setInterval(async () => {
      const user = auth.currentUser;
      console.log('TelaValidacaoUser: setInterval executado, currentUser:', user);
      if (user) {
        await reload(user);
        console.log('TelaValidacaoUser: setInterval - Usuário recarregado, emailVerificado:', user.emailVerified);
        if (user.emailVerified) {
          console.log('TelaValidacaoUser: setInterval - E-mail verificado!');
          setEmailVerificado(true);
          setBotaoHabilitado(true);
          clearInterval(intervaloRef.current!);

          // Buscar os dados do usuário do Firestore novamente (redundante, mas garante)
          const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        }
      }
    }, 5000);

    return () => {
      console.log('TelaValidacaoUser: useEffect desmontando');
      unsubscribe();
      if (intervaloRef.current) clearInterval(intervaloRef.current);
      if (cronometroRef.current) clearInterval(cronometroRef.current);
    };
  }, []);

  const handleFinalizarCadastro = async () => {
    const user = auth.currentUser;
    console.log('TelaValidacaoUser: handleFinalizarCadastro chamado, currentUser:', user);

    if (!user || !userData) {
      Alert.alert('Erro', 'Dados do usuário incompletos.');
      return;
    }

    try {
      // Os dados já foram salvos inicialmente, aqui podemos apenas atualizar o emailVerificado para true
      await setDoc(doc(db, 'usuarios', user.uid), { ...userData, emailVerificado: true });

      Alert.alert('Sucesso!', 'Cadastro realizado com sucesso!');
      navigation.navigate('TelaLogin');
    } catch (error: any) {
      console.error('TelaValidacaoUser: handleFinalizarCadastro - Erro:', error);
      Alert.alert('Erro', 'Não foi possível finalizar o cadastro.');
    }
  };

  const handleReenviarEmail = async () => {
    const user = auth.currentUser;
    console.log('TelaValidacaoUser: handleReenviarEmail chamado, currentUser:', user);

    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    try {
      console.log('TelaValidacaoUser: handleReenviarEmail - Enviando e-mail de verificação...');
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
      console.log('TelaValidacaoUser: handleReenviarEmail - Cronômetro iniciado.');
    } catch (error: any) {
      console.error('TelaValidacaoUser: handleReenviarEmail - Erro:', error);
      Alert.alert('Erro', 'Não foi possível enviar o e-mail.');
    }
  };

  console.log('TelaValidacaoUser: Renderizando - carregando:', carregando, 'emailVerificado:', emailVerificado, 'botaoHabilitado:', botaoHabilitado, 'cronometro:', cronometro, 'userData:', userData);

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
          disabled={!botaoHabilitado || !userData}
          onPress={handleFinalizarCadastro}
        >
          <Text style={styles.botaoTexto}>Finalizar Cadastro</Text>
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

      {userData && <Text>Dados do Usuário (para teste): {JSON.stringify(userData)}</Text>}
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