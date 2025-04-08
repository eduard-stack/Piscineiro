import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const TelaCadastro = () => {
  const navigation = useNavigation();

  const handleVoltar = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mensagem}>
        Obrigado pelo seu interesse em usar o Piscineiro.{"\n"}
        Esta tela ainda não foi criada.{"\n"}
        Volte mais tarde...
      </Text>

      <TouchableOpacity style={styles.botao} onPress={handleVoltar}>
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
  mensagem: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
    marginBottom: 30,
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

export default TelaCadastro;
