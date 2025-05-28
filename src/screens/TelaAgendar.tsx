// TelaAgendar.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RadioButton } from 'react-native-paper';
import { useNavigation, useRoute, NavigationProp } from '@react-navigation/native';
import { Image } from 'react-native';

// Importações do Firebase (mantenha se estiver usando)
import {
  collection, // Para referenciar uma coleção (ex: 'agendamentos')
  addDoc,     // Para adicionar um novo documento com ID automático
  doc,        // Para referenciar um documento específico (ex: um cliente)
  updateDoc,  // Para atualizar um documento existente
  setDoc,     // Para criar ou sobrescrever um documento, com opção de merge
  arrayUnion, // Para adicionar um item a um array sem duplicar
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig'; // Verifique o caminho!
import { getAuth } from 'firebase/auth';

import { RootStackParamList } from '../navigation/AppNavigator';

// Ajuste as interfaces
interface PrestadorParaAgendar {
  id: string;
  nome: string;
  foto: string;
  idade?: number;
  horario_atendimento: string | string[]; // Ex: ['08:00', '17:00']
  agendamentos: string | { data: string; hora: string }[]; // para simular horários ocupados
}

interface ServicoSelecionado {
  descricao: string;
  preco: number;
}


export default function TelaAgendar() {
  // Tipar useNavigation com NavigationProp e RootStackParamList
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { prestador, servicoSelecionado } = route.params as {
    prestador: PrestadorParaAgendar;
    servicoSelecionado: ServicoSelecionado;
  };
  console.log("Prestador recebido na TelaAgendar:", prestador); // <-- ADICIONE ESTE LOG
  console.log("Serviço Selecionado recebido na TelaAgendar:", servicoSelecionado); // <-- ADICIONE ESTE LOG

  // 🚀 SOLUÇÃO: USE useMemo PARA PARSEAR OS DADOS E GARANTIR REFERÊNCIA ESTÁVEL 🚀
  const parsedHorarioAtendimento = useMemo(() => {
    try {
      if (typeof prestador.horario_atendimento === 'string') {
        return JSON.parse(prestador.horario_atendimento) as string[];
      }
      return prestador.horario_atendimento as string[];
    } catch (e) {
      console.error("Erro ao parsear horario_atendimento:", e);
      return []; // Retorna um array vazio em caso de erro
    }
  }, [prestador.horario_atendimento]); // Recalcula apenas se prestador.horario_atendimento mudar

  const parsedAgendamentos = useMemo(() => {
    try {
      if (typeof prestador.agendamentos === 'string') {
        // Certifique-se de que o parseamento de "[]" resulte em um array vazio, não em um erro
        const parsed = JSON.parse(prestador.agendamentos);
        return Array.isArray(parsed) ? parsed : []; // Garante que seja um array
      }
      return prestador.agendamentos as { data: string; hora: string }[];
    } catch (e) {
      console.error("Erro ao parsear agendamentos:", e);
      return []; // Retorna um array vazio em caso de erro
    }
  }, [prestador.agendamentos]); // Recalcula apenas se prestador.agendamentos mudar
  // 🚀 FIM DA SOLUÇÃO 🚀

  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [horaSelecionada, setHoraSelecionada] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  const formasDePagamento = ['dinheiro', 'credito', 'debito', 'pix'];
  const [observacoes, setObservacoes] = useState('');
  const [horariosPossiveisDia, setHorariosPossiveisDia] = useState<string[]>([]);
  const [statusCarregamentoHorarios, setStatusCarregamentoHorarios] = useState<'carregando' | 'sucesso' | 'erro'>('carregando');


  // Funções de validação de horário usando useCallback
  const isTimeWithinServiceHours = useCallback((timeStr: string) => {
    if (!parsedHorarioAtendimento || parsedHorarioAtendimento.length < 2) {
      console.warn("isTimeWithinServiceHours: Horário de atendimento do prestador não está configurado corretamente.");
      return false;
    }
    const [inicioStr, fimStr] = parsedHorarioAtendimento;
    const [selectedHour, selectedMinute] = timeStr.split(':').map(Number);
    const [startHour, startMinute] = inicioStr.split(':').map(Number);
    const [endHour, endMinute] = fimStr.split(':').map(Number);

    const selectedTimeInMinutes = selectedHour * 60 + selectedMinute;
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;

    return selectedTimeInMinutes >= startTimeInMinutes && selectedTimeInMinutes < endTimeInMinutes;
  }, [parsedHorarioAtendimento]);

  const isTimeAlreadyBooked = useCallback((date: Date, timeStr: string) => {
    const dataString = date.toDateString();
    return parsedAgendamentos.some(
      (ag) => ag.data === dataString && ag.hora === timeStr
    );
  }, [parsedAgendamentos]);


  // useEffect para recalcular os horários possíveis do dia
  useEffect(() => {
    const generateAllPossibleDayHours = () => {
      setStatusCarregamentoHorarios('carregando');
      console.log("prestador.horario_atendimento:", prestador.horario_atendimento); // <-- ADICIONE ESTE LOG
      console.log("prestador.agendamentos:", prestador.agendamentos); // <-- E ESTE TAMBÉM
      if (!parsedHorarioAtendimento || parsedHorarioAtendimento.length < 2) { // <--- USANDO O PARSEADO
        console.warn("Prestador.horario_atendimento inválido. Não é possível gerar horários.");
        setHorariosPossiveisDia([]);
        setStatusCarregamentoHorarios('erro'); // Define erro se não há horário configurado
        return;
      }

      const [inicioStr, fimStr] = parsedHorarioAtendimento; // <--- USANDO O PARSEADO
      const inicioHora = parseInt(inicioStr.split(':')[0]);
      const fimHora = parseInt(fimStr.split(':')[0]);
      console.log(`Horário de atendimento: <span class="math-inline">\{inicioStr\}\-</span>{fimStr}`); // <-- LOG
      console.log(`Horas parseadas: Início=<span class="math-inline">\{inicioHora\}, Fim\=</span>{fimHora}`); // <-- LOG

      const allHours: string[] = [];

      // Loop para gerar horários de hora em hora
      for (let h = inicioHora; h < fimHora; h++) {
        const horaStr = h.toString().padStart(2, '0') + ':00';
        allHours.push(horaStr);
      }
      setHorariosPossiveisDia(allHours);
      console.log("Horários gerados:", allHours); // <-- LOG
      setHoraSelecionada(''); // Reseta a hora selecionada ao mudar a data
      setStatusCarregamentoHorarios('sucesso');
    };

    generateAllPossibleDayHours();
  }, [dataSelecionada, parsedHorarioAtendimento]);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setDataSelecionada(selectedDate);
    }
  };

  const handleTimeSelection = (time: string) => {
    if (!isTimeWithinServiceHours(time)) {
      Alert.alert('Horário Inválido', `O prestador ${prestador.nome} não atende no horário de ${time}. Horário de atendimento: ${prestador.horario_atendimento[0]} - ${prestador.horario_atendimento[1]}.`);
      setHoraSelecionada('');
      return;
    }
    if (isTimeAlreadyBooked(dataSelecionada, time)) {
      Alert.alert('Horário Ocupado', `O horário de ${time} no dia ${dataSelecionada.toLocaleDateString('pt-BR')} já está agendado. Por favor, escolha outro.`);
      setHoraSelecionada('');
      return;
    }
    setHoraSelecionada(time);
  };


  const finalizarAgendamento = () => {
    if (!horaSelecionada) {
      Alert.alert('Erro', 'Selecione um horário válido.');
      return;
    }

    if (!isTimeWithinServiceHours(horaSelecionada)) {
      Alert.alert('Erro', `O horário selecionado (${horaSelecionada}) está fora do horário de atendimento do prestador (${prestador.horario_atendimento[0]} - ${prestador.horario_atendimento[1]}).`);
      return;
    }
    if (isTimeAlreadyBooked(dataSelecionada, horaSelecionada)) {
      Alert.alert('Erro', `O horário de ${horaSelecionada} no dia ${dataSelecionada.toLocaleDateString('pt-BR')} já está agendado. Por favor, escolha outro.`);
      return;
    }

    Alert.alert(
      'Confirmação de Agendamento',
      `Você está prestes a agendar:\n\n` +
      `Prestador: ${prestador.nome}${prestador.idade ? ` (${prestador.idade} anos)` : ''}\n` +
      `Serviço: ${servicoSelecionado.descricao} (R$ ${servicoSelecionado.preco.toFixed(2)})\n` +
      `Data: ${dataSelecionada.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n` +
      `Hora: ${horaSelecionada}\n` +
      `Forma de Pagamento: ${formaPagamento.charAt(0).toUpperCase() + formaPagamento.slice(1)}\n` +
      `Observações: ${observacoes || 'Nenhuma'}\n\n` +
      `Deseja confirmar?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const auth = getAuth(); // Obtenha a instância de autenticação aqui
              const currentUser = auth.currentUser;
              if (!currentUser) {
                Alert.alert('Erro de Autenticação', 'Você precisa estar logado para agendar um serviço. Por favor, faça login novamente.');
                navigation.navigate('TelaLogin'); // Ou navegue para a tela de login
                return;
              }

              const agendamentoParaSalvar = {
                data: dataSelecionada.toDateString(),
                hora: horaSelecionada,
                servico: servicoSelecionado.descricao,
                preco: servicoSelecionado.preco,
                formaPagamento: formaPagamento,
                observacoes: observacoes,
                clienteId: currentUser.uid,
                prestadorId: prestador.id,
                timestampAgendamento: new Date().toISOString(),
                status: 'pendente', // ou 'confirmado', dependendo do fluxo
              };

        // Salvar o agendamento na coleção 'agendamentos'
    // Esta é a única operação de escrita no banco de dados para o agendamento
    const novoAgendamentoRef = await addDoc(collection(db, 'agendamentos'), agendamentoParaSalvar);
    console.log("Agendamento salvo na coleção 'agendamentos' com ID:", novoAgendamentoRef.id);

    Alert.alert('Sucesso', 'Agendamento realizado com sucesso!');
    navigation.goBack(); // Volta para a tela anterior (ou para a lista de agendamentos do cliente)

  } catch (error: unknown) {
    console.error("Erro ao finalizar agendamento:", error);
    let errorMessage = 'Um erro desconhecido ocorreu.';

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
              Alert.alert('Erro', `Não foi possível finalizar o agendamento. Verifique sua conexão ou tente novamente. Detalhes: ${error instanceof Error ? error.message : String(error)
                }`);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={{ uri: prestador.foto }}
        style={styles.prestadorImage}
      />

      <View style={styles.prestadorInfoBox}>
        <Text style={styles.prestadorName}>
          {prestador.nome}
          {prestador.idade ? ` (${prestador.idade} anos)` : ''}
        </Text>
        <Text style={styles.serviceDescription}>{servicoSelecionado.descricao}</Text>
        <Text style={styles.servicePrice}>R$ {servicoSelecionado.preco.toFixed(2)}</Text>
      </View>

      <Text style={styles.sectionTitle}>Selecione o dia</Text>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={styles.datePickerButton}
      >
        <Text style={styles.datePickerButtonText}>
          {dataSelecionada.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={dataSelecionada}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeDate}
          minimumDate={new Date()}
        />
      )}

      <Text style={styles.sectionTitle}>Selecione o horário</Text>
      <View style={styles.timeSlotsContainer}>
        {statusCarregamentoHorarios === 'carregando' && (
          <Text style={styles.infoText}>Carregando horários...</Text>
        )}
        {statusCarregamentoHorarios === 'erro' && (
          <Text style={[styles.infoText, styles.warningText]}>
            Não foi possível carregar os horários. Verifique se o horário de atendimento do prestador está configurado.
          </Text>
        )}
        {statusCarregamentoHorarios === 'sucesso' && horariosPossiveisDia.length > 0 ? (
          horariosPossiveisDia.map((hora) => (
            <TouchableOpacity
              key={hora}
              disabled={isTimeAlreadyBooked(dataSelecionada, hora) || !isTimeWithinServiceHours(hora)} // Desabilita se agendado OU fora do range
              style={[
                styles.timeSlotButton,
                hora === horaSelecionada && styles.selectedTimeSlot,
                (isTimeAlreadyBooked(dataSelecionada, hora) || !isTimeWithinServiceHours(hora)) && styles.bookedTimeSlot, // Usa o mesmo estilo para agendado e fora do range
              ]}
              onPress={() => handleTimeSelection(hora)}
            >
              <Text style={[
                styles.timeSlotText,
                hora === horaSelecionada && styles.selectedTimeSlotText,
                (isTimeAlreadyBooked(dataSelecionada, hora) || !isTimeWithinServiceHours(hora)) && styles.bookedTimeSlotText,
              ]}>
                {hora}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          statusCarregamentoHorarios === 'sucesso' && horariosPossiveisDia.length === 0 && (
            <Text style={styles.infoText}>Nenhum horário disponível para esta data dentro do período de atendimento do prestador.</Text>
          )
        )}
      </View>

      <Text style={styles.sectionTitle}>Forma de pagamento</Text>
      <RadioButton.Group onValueChange={setFormaPagamento} value={formaPagamento}>
      <View style={styles.radioGroupWrapper}> {/* <-- NOVO CONTÊINER AQUI */}
        {formasDePagamento.map((opcao) => (
          <View key={opcao} style={styles.radioButtonContainer}>
            <RadioButton value={opcao} />
            <Text>{opcao.charAt(0).toUpperCase() + opcao.slice(1)}</Text>
          </View>
        ))}
      </View>
    </RadioButton.Group>

      <Text style={styles.sectionTitle}>Observações</Text>
      <TextInput
        multiline
        maxLength={300}
        value={observacoes}
        onChangeText={setObservacoes}
        placeholder="Insira alguma observação (opcional)"
        style={styles.observationsInput}
      />

      <TouchableOpacity
        style={styles.finalizarButton}
        onPress={finalizarAgendamento}
      >
        <Text style={styles.finalizarButtonText}>FINALIZAR AGENDAMENTO</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  prestadorImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 10,
  },
  prestadorInfoBox: {
    backgroundColor: '#E0F0FF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  prestadorName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#333',
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  sectionTitle: {
    marginTop: 20,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  datePickerButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginTop: 5,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 10,
    minHeight: 50,
  },
  timeSlotButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#D3D3D3',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D3D3D3',
  },
  selectedTimeSlot: {
    backgroundColor: '#007BFF',
    borderColor: '#007BFF',
  },
  bookedTimeSlot: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FF6666',
  },
  timeSlotText: {
    color: 'black',
    fontWeight: 'bold',
  },
  selectedTimeSlotText: {
    color: 'white',
  },
  bookedTimeSlotText: {
    color: '#FF6666',
    textDecorationLine: 'line-through',
  },
  infoText: {
    color: '#999',
    marginTop: 5,
    width: '100%',
  },
  warningText: {
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  radioGroupWrapper: { // <-- NOVO ESTILO APLICADO AO CONTÊINER DO GRUPO
    flexDirection: 'row', // Alinha os itens em uma linha
    flexWrap: 'wrap',     // Permite que os itens quebrem para a próxima linha
    // Opcional: Para espaçamento entre os radio buttons
    // justifyContent: 'space-around', // Distribui o espaço igualmente
    // gap: 10, // Se React Native 0.71+
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 5,
  },
  observationsInput: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  finalizarButton: {
    marginTop: 10,
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  finalizarButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});