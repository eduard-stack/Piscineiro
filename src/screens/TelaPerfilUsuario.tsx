// TelaPerfilUser.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native'; // Importe View, Text e StyleSheet

const TelaPerfilUser = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.messageText}>
        Esta tela de perfil será desenvolvida na próxima versão.
      </Text>
      <Text style={styles.subMessageText}>
        Aguarde por novidades!
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  messageText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
  },
  subMessageText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});

export default TelaPerfilUser;