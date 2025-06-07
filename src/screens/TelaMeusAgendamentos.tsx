// TelaMeusAgendamentos.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { db } from '../services/firebaseConfig';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    runTransaction,
    arrayRemove,
    Timestamp,
} from 'firebase/firestore';
import { RootStackParamList } from '../navigation/AppNavigator';

interface Agendamento {
    id: string;
    clienteId: string;
    data: string;
    formaPagamento: string;
    hora: string;
    observacoes?: string;
    servicoPreco: number;
    prestadorId: string;
    prestadorNome: string;
    servicoDescricao: string;
    status: string;
    timestampAgendamento: string | Timestamp;
}

interface AgendamentoNoPrestador {
    agendamentoId: string;
    clienteId: string;
    data: string;
    hora: string;
}

export default function TelaMeusAgendamentos() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [meusAgendamentos, setMeusAgendamentos] = useState<Agendamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const auth = getAuth();
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            setError('Usuário não autenticado.');
            return;
        }

        const q = query(
            collection(db, 'agendamentos'),
            where('clienteId', '==', currentUser.uid),
            orderBy('timestampAgendamento', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (querySnapshot) => {
                const lista: Agendamento[] = [];
                querySnapshot.forEach((docSnapshot) => {
                    const data = docSnapshot.data();
                    lista.push({
                        id: docSnapshot.id,
                        clienteId: data.clienteId,
                        data: data.data,
                        formaPagamento: data.formaPagamento,
                        hora: data.hora,
                        observacoes: data.observacoes || '',
                        servicoPreco: typeof data.servicoPreco === 'number'
                            ? data.servicoPreco
                            : parseFloat(data.servicoPreco as any) || 0,
                        prestadorId: data.prestadorId,
                        prestadorNome: data.prestadorNome,
                        servicoDescricao: data.servicoDescricao || 'Serviço não informado',
                        status: data.status,
                        timestampAgendamento: data.timestampAgendamento,
                    });
                });
                setMeusAgendamentos(lista);
                setError(null);
                setLoading(false);
            },
            (err) => {
                console.error('Erro ao buscar agendamentos:', err);
                setError('Não foi possível carregar seus agendamentos.');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    const handleCancelarAgendamento = useCallback(async (agendamento: Agendamento) => {
        Alert.alert(
            'Cancelar Agendamento',
            'Você realmente deseja cancelar este agendamento?\n\n' +
        'Atenção: Cancelamentos com menos de 1 hora de antecedência ' +
        'estarão sujeitos ao pagamento do deslocamento do prestador.',

            [
                { text: 'Manter Agendamento', style: 'cancel' },
                {
                    text: 'Quero Cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        if (!currentUser) {
                            Alert.alert('Erro', 'Usuário não autenticado.');
                            return;
                        }

                        const agendamentoRef = doc(db, 'agendamentos', agendamento.id);
                        const prestadorRef = doc(db, 'prestadores', agendamento.prestadorId);
                        const agendamentoRemover: AgendamentoNoPrestador = {
                            agendamentoId: agendamento.id,
                            clienteId: agendamento.clienteId,
                            data: agendamento.data,
                            hora: agendamento.hora,
                        };

                        try {
                            await runTransaction(db, async (transaction) => {
                                transaction.delete(agendamentoRef);
                                transaction.update(prestadorRef, {
                                    agendamentos: arrayRemove(agendamentoRemover),
                                });
                            });
                            Alert.alert('Sucesso', 'Agendamento cancelado com sucesso.');
                        } catch (err) {
                            console.error('Erro ao cancelar agendamento:', err);
                            Alert.alert('Erro', 'Não foi possível cancelar. Tente novamente.');
                        }
                    },
                },
            ]
        );
    }, [currentUser]);




    const renderItem = ({ item }: { item: Agendamento }) => {
        let dataFormatada = 'Data inválida';

        try {
            if (typeof item.data === 'string') {
                const data = new Date(item.data);
                if (!isNaN(data.getTime())) {
                    dataFormatada = data.toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                    });
                }
            }
        } catch (error) {
            console.warn('Erro ao formatar data:', error);
        }

        // ... resto do return() permanece igual


        return (
            <View style={styles.card}>
                <Text style={styles.titulo}>Serviço: {item.servicoDescricao}</Text>
                <Text style={styles.detalhe}>Prestador: {item.prestadorNome}</Text>
                <Text style={styles.detalhe}>Data: {dataFormatada}</Text>
                <Text style={styles.detalhe}>Hora: {item.hora}</Text>
                <Text style={styles.detalhe}>Preço: R$ {item.servicoPreco.toFixed(2)}</Text>
                <Text style={styles.detalhe}>Pagamento: {item.formaPagamento}</Text>
                {item.observacoes ? (
                    <Text style={styles.detalhe}>Obs: {item.observacoes}</Text>
                ) : null}
                <Text style={styles.status}>Status: {item.status}</Text>

                <TouchableOpacity
                    style={styles.botaoCancelar}
                    onPress={() => handleCancelarAgendamento(item)}
                >
                    <Text style={styles.textoBotaoCancelar}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.centralizado}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text>Carregando agendamentos...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centralizado}>
                <Text style={{ color: 'red' }}>{error}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
         <Text style={styles.headerTitle}>Seus agendamentos estão aqui:</Text>
            
            <FlatList
                data={meusAgendamentos}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListEmptyComponent={
                    <Text style={styles.centralizado}>Você não possui agendamentos.</Text>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f7f7',
        padding: 10,
        paddingTop: 30,
        justifyContent: 'center',
    },
    card: {
       backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: '#007BFF',

    },
    titulo: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#0056b3',

    },
    detalhe: {
        fontSize: 14,
        marginBottom: 2,
        color: '#555',
    },
    status: {
        marginTop: 6,
        fontWeight: 'bold',
        color: '#007bff',
    },
    botaoCancelar: {
        marginTop: 12,
        backgroundColor: '#dc3545',
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    textoBotaoCancelar: {
        color: '#fff',
        fontWeight: 'bold',
    },
    centralizado: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },

});
