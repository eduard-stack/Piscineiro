import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { FontAwesome } from '@expo/vector-icons';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import { Timestamp } from "firebase/firestore";

type PerfilPrestadorRouteProp = RouteProp<RootStackParamList, 'TelaPerfilPrestador'>;

const PerfilPrestador = () => {
  const route = useRoute<PerfilPrestadorRouteProp>();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const prestador = route.params?.prestador;

  const [favorito, setFavorito] = useState(false);
  const [servicos, setServicos] = useState<any[]>([]);
  const [imagemAmpliada, setImagemAmpliada] = useState(false);

  if (!prestador) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 20 }}>
          Prestador não encontrado.
        </Text>
      </View>
    );
  }

  const carregarServicos = async () => {
    try {
      const docRef = doc(db, 'prestadores', prestador.id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const dados = snapshot.data();
        setServicos(Array.isArray(dados.servicos) ? dados.servicos : []);
      } else {
        console.warn('Prestador não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
    }
  };

  const verificarFavorito = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

     const favoritoDocId = `${user.uid}_${prestador.id}`;
    const favoritoRef = doc(db, 'favoritos', favoritoDocId);
    const docSnap = await getDoc(favoritoRef);

      setFavorito(docSnap.exists());
    } catch (error) {
      console.error('Erro ao verificar favorito:', error);
    }
  };

  const alternarFavorito = async () => {
  if (!auth.currentUser) {
    alert("Você precisa estar logado para favoritar.");
    return;
  }

  const userId = auth.currentUser.uid;
  const favoritoDocId = `${userId}_${prestador.id}`; // chave única para evitar duplicados

  const docRef = doc(db, "favoritos", favoritoDocId);
  const docSnap = await getDoc(docRef);

  try {
    if (docSnap.exists()) {
      // Já é favorito, vamos remover
      await deleteDoc(docRef);
      setFavorito(false);
      Alert.alert("Removido dos favoritos", `${prestador.nome} foi removido da sua lista de favoritos.`);
    } else {
      // Não é favorito, vamos adicionar
      await setDoc(docRef, {
        userId: userId,
        prestadorId: prestador.id,
        nome: prestador.nome,
        idade: prestador.idade || 0,
        foto: prestador.foto,
        dataAdicao: Timestamp.now(),
      });
      setFavorito(true);
       Alert.alert("Adicionado aos favoritos", `${prestador.nome} foi adicionado à sua lista de favoritos.`);
    }
  } catch (error) {
    console.error("Erro ao alternar favorito:", error);
    alert("Erro ao salvar favorito. Tente novamente.");
  }
};


 useEffect(() => {
  if (prestador?.id) {
    carregarServicos();
    verificarFavorito();
  }
}, [prestador?.id]);


  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.botaoVoltar}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <FontAwesome name="arrow-left" size={24} color="#000" />
      </TouchableOpacity>

      <View style={styles.header}>
        <TouchableOpacity onPress={alternarFavorito} style={styles.favoritoBtn}>
          <FontAwesome
            name={favorito ? 'heart' : 'heart-o'}
            size={26}
            color="red"
            style={styles.iconeFavorito}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => prestador.foto && setImagemAmpliada(true)}
        >
          {prestador.foto ? (
            <Image source={{ uri: prestador.foto }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }]}>
              <FontAwesome name="user" size={40} color="#777" />
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.nome}>{prestador.nome || 'Nome não informado'}</Text>
        {prestador.idade && <Text style={styles.idade}>{prestador.idade} anos</Text>}
      </View>

      <Modal
        visible={imagemAmpliada}
        transparent
        animationType="fade"
        onRequestClose={() => setImagemAmpliada(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.imagemWrapper}>
            <Image
              source={{ uri: prestador.foto }}
              style={styles.imagemGrande}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.botaoFechar}
              onPress={() => setImagemAmpliada(false)}
            >
              <FontAwesome name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FlatList
        data={servicos}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.servicoInfo}>
              <Text style={styles.servicoDescricao}>
                {item?.descricao || 'Serviço sem descrição'}
              </Text>
              <Text style={styles.servicoPreco}>
                R$ {item?.preco ? Number(item.preco).toFixed(2) : '0.00'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.botaoAgendar}
              onPress={() =>
                navigation.navigate('TelaAgendar', {
                  prestador,
                  servicoSelecionado: item,
                })
              }
            >
              <Text style={styles.botaoAgendarTexto}>Agendar</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Nenhum serviço cadastrado para este prestador.
          </Text>
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
  botaoVoltar: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  header: {
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    position: 'relative',
  },
  favoritoBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    
    zIndex: 2,
  },
  iconeFavorito: {
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginRight: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#007BFF',
    marginBottom: 12,
  },
  nome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  servicoInfo: {
    flex: 1,
    marginRight: 12,
  },
  servicoDescricao: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  servicoPreco: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  botaoAgendar: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  botaoAgendarTexto: {
    color: '#fff',
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagemWrapper: {
    width: '90%',
    alignItems: 'flex-end',
  },
  imagemGrande: {
    width: '100%',
    height: 400,
    borderRadius: 10,
  },
  botaoFechar: {
    position: 'absolute',
    top: -25,
    right: 9,
    zIndex: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 5,
    borderRadius: 5,
  },
});
