import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../services/firebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification, fetchSignInMethodsForEmail } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

const TelaCadastro: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [emailInUse, setEmailInUse] = useState(false);
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [semNumero, setSemNumero] = useState(false);
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [complemento, setComplemento] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const emailTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!email) return;

    if (emailTimeout.current) {
      clearTimeout(emailTimeout.current);
    }

    emailTimeout.current = setTimeout(() => {
      verificarEmail(email);
    }, 800);
  }, [email]);

  const verificarEmail = async (emailDigitado: string) => {
    setEmailInUse(false);
    if (emailDigitado.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      try {
        const methods = await fetchSignInMethodsForEmail(auth, emailDigitado);
        if (methods.length > 0) {
          setEmailInUse(true);
          Alert.alert('Esse e-mail já está em uso', 'Tente novamente com outro e-mail.');
        }
      } catch (error) {
        console.log('Erro ao verificar e-mail:', error);
      }
    }
  };

  const buscarEndereco = async (cepDigitado: string) => {
    setCep(cepDigitado);
    if (cepDigitado.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepDigitado}/json/`);
        const data = await response.json();
        if (data.erro) {
          Alert.alert('CEP inválido', 'Não foi possível localizar o endereço.');
          return;
        }
        setRua(data.logradouro || '');
        setBairro(data.bairro || '');
        setCidade(data.localidade || '');
        setEstado(data.uf || '');
      } catch (error) {
        Alert.alert('Erro', 'Falha ao buscar o endereço.');
      }
    }
  };

  const validarCampos = (): boolean => {
    if (!nome.trim()) return Alert.alert('Erro', 'O nome é obrigatório.'), false;
    if (!cpf.match(/^\d{11}$/)) return Alert.alert('Erro', 'CPF deve ter 11 dígitos.'), false;
    if (!telefone.match(/^\d{10,11}$/)) return Alert.alert('Erro', 'Telefone deve ter 10 ou 11 dígitos.'), false;
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return Alert.alert('Erro', 'E-mail inválido.'), false;
    if (emailInUse) return Alert.alert('Erro', 'Esse e-mail já está em uso.'), false;
    if (!cep.match(/^\d{8}$/)) return Alert.alert('Erro', 'CEP deve ter 8 dígitos.'), false;
    if (!rua) return Alert.alert('Erro', 'Rua é obrigatória.'), false;
    if (!semNumero && !numero) return Alert.alert('Erro', 'Número é obrigatório.'), false;
    if (semNumero && !complemento.trim()) return Alert.alert('Erro', 'Complemento é obrigatório quando "Sem número" está marcado.'), false;
    if (!bairro) return Alert.alert('Erro', 'Bairro é obrigatório.'), false;
    if (!cidade) return Alert.alert('Erro', 'Cidade é obrigatória.'), false;
    if (!estado) return Alert.alert('Erro', 'Estado é obrigatório.'), false;
    if (senha.length < 6) return Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.'), false;
    if (senha !== confirmarSenha) return Alert.alert('Erro', 'As senhas não coincidem.'), false;
    return true;
  };

  const handleCadastro = async () => {
    if (!validarCampos()) return;
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;
      await sendEmailVerification(user);
      Alert.alert('Verifique seu e-mail', 'Enviamos um código de verificação para seu e-mail. Digite o código na próxima tela para concluir o cadastro.');
      navigation.navigate('TelaValidacaoUser', {
        userData: {
          uid: user.uid,
          nome,
          cpf,
          telefone,
          email,
          cep,
          rua,
          numero: semNumero ? 'S/N' : numero,
          complemento,
          bairro,
          cidade,
          estado,
          semNumero,
        },
      });
    } catch (error: any) {
      console.log(error.message);
      Alert.alert('Erro ao cadastrar, verifique os dados e tente novamente!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.titulo}>Olá Cliente, faça seu Cadastro!</Text>

          <TextInput style={styles.input} placeholder="Nome" value={nome} onChangeText={setNome} />
          <TextInput style={styles.input} placeholder="CPF" value={cpf} onChangeText={setCpf} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Telefone" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput style={styles.input} placeholder="CEP" value={cep} onChangeText={buscarEndereco} keyboardType="numeric" maxLength={8} />
          <TextInput style={styles.input} placeholder="Rua" value={rua} onChangeText={setRua} />

          <View style={styles.numeroContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Número"
              value={numero}
              onChangeText={setNumero}
              keyboardType="numeric"
              editable={!semNumero}
            />
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => {
                const novoEstado = !semNumero;
                setSemNumero(novoEstado);
                if (novoEstado) setNumero('');
              }}
            >
              <View style={[styles.checkbox, { backgroundColor: semNumero ? '#007BFF' : '#fff' }]}>
                {semNumero && <Feather name="check" size={16} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>Sem número</Text>
            </TouchableOpacity>
          </View>

          <TextInput style={styles.input} placeholder="Complemento (opcional)" value={complemento} onChangeText={setComplemento} />
          <TextInput style={styles.input} placeholder="Bairro" value={bairro} onChangeText={setBairro} />
          <TextInput style={styles.input} placeholder="Cidade" value={cidade} onChangeText={setCidade} />
          <TextInput style={styles.input} placeholder="Estado" value={estado} onChangeText={setEstado} />
          <TextInput style={styles.input} placeholder="Senha" value={senha} onChangeText={setSenha} secureTextEntry />
          <TextInput style={styles.input} placeholder="Confirmar Senha" value={confirmarSenha} onChangeText={setConfirmarSenha} secureTextEntry />

          <TouchableOpacity style={styles.botao} onPress={handleCadastro} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>Cadastrar</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('TelaLogin')}>
            <Text style={styles.cadastroText}>Já possui uma conta? <Text style={{ fontWeight: 'bold' }}>Faça Login</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
    paddingBottom: 30,
  },
  titulo: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#007BFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    padding: 10,
    borderRadius: 6,
  },
  botao: {
    backgroundColor: '#007BFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  botaoTexto: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  numeroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  checkboxLabel: {
    marginLeft: 6,
    fontSize: 14,
  },
  cadastroText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
});

export default TelaCadastro;
