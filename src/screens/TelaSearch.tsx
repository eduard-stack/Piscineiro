import React, { useState, useCallback } from 'react';
import {
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    Text,
    FlatList,
    Image,
    StyleSheet,
    Alert,
    View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Dimensions } from 'react-native';

const screenHeight = Dimensions.get('window').height;

export type Prestador = {
    id: string;
    nome: string;
    foto: string;
    idade?: number;
    cidades_atendidas: string[];
    servicos?: {
        descricao: string;
        preco: number;
    }[];
    horario_atendimento: string[]; // Ex: ['08:00', '18:00']
    agendamentos: { data: string; hora: string }[];
};

const TelaSearch = () => {
    const [cidade, setCidade] = useState('');
    const [resultados, setResultados] = useState<Prestador[]>([]);
    const [pesquisou, setPesquisou] = useState(false);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    useFocusEffect(
        useCallback(() => {
            setResultados([]);
            setCidade('');
            setPesquisou(false);
        }, [])
    );

    const buscarPrestadores = async () => {
        if (!cidade.trim()) {
            Alert.alert('Digite o nome de uma cidade');
            return;
        }

        try {
            const prestadoresRef = collection(db, 'prestadores');
            const q = query(prestadoresRef, where('cidades_atendidas', 'array-contains', cidade.trim()));
            const querySnapshot = await getDocs(q);

            const dados: Prestador[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                dados.push({
                    id: doc.id,
                    nome: data.nome,
                    foto: data.foto,
                    idade: data.idade,
                    cidades_atendidas: data.cidades_atendidas,
                    servicos: data.servicos || [],
                    horario_atendimento: data.horario_atendimento || [],
                    agendamentos: data.agendamentos || [],
                });
            });

            setResultados(dados);
            setPesquisou(true);
        } catch (error) {
            console.error('Erro ao buscar prestadores:', error);
            Alert.alert('Erro ao buscar prestadores');
        }
    };

    const abrirPerfilPrestador = (prestador: Prestador) => {
        navigation.navigate('TelaPerfilPrestador', { prestador });
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.label}>Enconte um prestador:</Text>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Digite a sua cidade aqui"
                    value={cidade}
                    onChangeText={setCidade}
                    autoCorrect={false}
                    keyboardType="default"
                    textContentType="none"
                    autoCapitalize="words"
                />
                <TouchableOpacity onPress={buscarPrestadores} style={styles.iconButton}>
                    <Feather name="search" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {!pesquisou && (
                <View style={styles.centeredImageContainer}>
                    <Image
                        source={require('../../assets/profissional_limpeza.jpg')} // Altere o caminho conforme necessário
                        style={styles.centeredImage}
                        resizeMode="cover"
                    />
                </View>
            )}

            {pesquisou && resultados.length === 0 ? (
                <Text style={styles.empty}>Ops! Nenhum Prestador Encontrado.😔Estamos trabalhando para expandir nossa rede! Que tal tentar novamente mais tarde ou buscar em cidades próximas?
                </Text>
            ) : (
                <FlatList
                    data={resultados}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.card} onPress={() => abrirPerfilPrestador(item)}>
                            <Image source={{ uri: item.foto }} style={styles.image} />
                            <View style={styles.cardContent}>
                                <Text style={styles.nome}>{item.nome}</Text>
                                <TouchableOpacity style={styles.button} onPress={() => abrirPerfilPrestador(item)}>
                                    <Text style={styles.buttonText}>Agendar</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
};

export default TelaSearch;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        paddingTop: 65,
        backgroundColor: '#fff',
    },
    label: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'left',
    },
    searchContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    input: {
        flex: 1,
        backgroundColor: '#eee',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    iconButton: {
        backgroundColor: '#007bff',
        padding: 12,
        borderRadius: 8,
        marginLeft: 8,
        justifyContent: 'center',
    },
    centeredImageContainer: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 24, // evita encostar no tab bar

    },
    centeredImage: {
        width: '95%',           // ocupa 95% da largura da tela
        height: screenHeight * 0.6, // 60% da altura da tela
        opacity: 0.9,
        borderRadius: 12,
    },
    card: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#f8f8f8',
        marginBottom: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
    },
    nome: {
        fontSize: 18,
        fontWeight: '600',
    },
    button: {
        marginTop: 8,
        backgroundColor: '#007bff',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
    },
    empty: {
        textAlign: 'center',
        marginTop: 20,
        color: 'red',
        fontSize: 14,
    },
});
