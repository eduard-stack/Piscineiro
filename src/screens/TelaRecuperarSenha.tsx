import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  TelaLogin: undefined;
  TelaRecuperarSenha: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'TelaRecuperarSenha'>;

const TelaRecuperarSenha: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState<string>('');

  const handleRecuperarSenha = () => {
    const auth = getAuth();
    sendPasswordResetEmail(auth, email)
      .then(() => {
        Alert.alert('Email de Recuperação Enviado', 'Verifique seu email para redefinir sua senha.');
        navigation.navigate('TelaLogin');
      })
      .catch((error) => {
        Alert.alert('Erro ao Enviar Email');
        console.log(error.message)
      });
  };

  const handleCancelar = () => {
    navigation.navigate('TelaLogin');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Digite seu email para recuperar a senha:</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handleRecuperarSenha}>
        <Text style={styles.buttonText}>Recuperar Senha</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancelar}>
        <Text style={styles.cancelButtonText}>Cancelar</Text>
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
  text: {
    fontSize: 18,
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
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  cancelButton: {
    width: '100%',
    height: 40,
    backgroundColor: 'grey',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 10,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default TelaRecuperarSenha;
