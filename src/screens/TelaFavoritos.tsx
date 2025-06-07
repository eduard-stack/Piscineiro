import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  doc,
  getDocs,
  deleteDoc,
  collection,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "../services/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../navigation/AppNavigator";
import { StackNavigationProp } from "@react-navigation/stack";

type Favorito = {
  id: string;
  userId: string;
  prestadorId: string;
  nome: string;
  foto: string;
  cidade: string;
  idade: number;
};

type NavigationProp = StackNavigationProp<RootStackParamList, "TelaFavoritos">;

export default function TelaFavoritos() {
  const navigation = useNavigation<NavigationProp>();
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);

  const carregarFavoritos = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const favoritosRef = collection(db, "favoritos");
    const q = query(favoritosRef, where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);

    const dados: Favorito[] = querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Favorito[];

    setFavoritos(dados);
  };

  const removerFavorito = async (favoritoId: string) => {
    try {
      await deleteDoc(doc(db, "favoritos", favoritoId));
      // Exibe o alerta
      Alert.alert("Removido dos favoritos");

      // Remove da lista visível
      setFavoritos((prev) => prev.filter((fav) => fav.id !== favoritoId));
    } catch (error) {
      console.error("Erro ao remover favorito:", error);
      Alert.alert("Erro", "Não foi possível remover dos favoritos.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarFavoritos();
    }, [])
  );

  const renderItem = ({ item }: { item: Favorito }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.foto }} style={styles.foto} />
      <View style={styles.conteudo}>
        <Text style={styles.nome}>{item.nome}</Text>
        <Text style={styles.cidade}>{item.cidade}</Text>
        <Text style={styles.idade}>{item.idade} anos</Text>
      </View>
      <TouchableOpacity
        style={styles.coracao}
        onPress={() => removerFavorito(item.id)}
      >
        <Ionicons name="heart" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>
        Aqui estão os seus prestadores favoritos
      </Text>

      <FlatList
        data={favoritos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            Nenhum favorito encontrado
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginTop: 33,
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    elevation: 2,
    position: "relative",
  },
  foto: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 10,
  },
  conteudo: {
    flex: 1,
    justifyContent: "center",
  },
  nome: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  cidade: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 4,

  },
  idade: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 2,
  },

  coracao: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingRight: 10,
  },
  botaoPerfil: {
    marginTop: 8,
    backgroundColor: "#007bff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "center",
  },
  textoBotao: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
