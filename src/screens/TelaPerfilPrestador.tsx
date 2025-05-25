import React from 'react';
import { View, Text, Image, FlatList, StyleSheet } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

type PerfilPrestadorRouteProp = RouteProp<RootStackParamList, 'TelaPerfilPrestador'>;

const PerfilPrestador = () => {
  const route = useRoute<PerfilPrestadorRouteProp>();
  const { prestador } = route.params;

  return (
    <View style={styles.container}>
      {/* Seção do cabeçalho com fundo amarelo */}
      <View style={styles.header}>
        <Image source={{ uri: prestador.foto }} style={styles.avatar} />
        <Text style={styles.nome}>{prestador.nome}</Text>
        {/* Exibe idade se estiver disponível */}
        {prestador.idade && <Text style={styles.idade}>{prestador.idade} anos</Text>}
      </View>

      {/* Lista de serviços */}
      <FlatList
        data={prestador.servicos || []}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.servicoNome}>{item.nome}</Text>
            <Text style={styles.servicoPreco}>R$ {item.preco.toFixed(2)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum serviço cadastrado para este prestador.</Text>
        }
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
};

export default PerfilPrestador;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#FFD700',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 12,
  },
  nome: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  idade: {
    fontSize: 16,
    color: '#555',
  },
  card: {
    backgroundColor: '#f1f1f1',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  servicoNome: {
    fontSize: 16,
    fontWeight: '600',
  },
  servicoPreco: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
});
