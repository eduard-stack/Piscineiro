// TelaAgendar.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RadioButton } from 'react-native-paper';
import { useNavigation, useRoute, NavigationProp } from '@react-navigation/native';
import { Image } from 'react-native';

// Importações do Firebase
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  setDoc,
  arrayUnion,
  getDoc,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { getAuth } from 'firebase/auth';

import { RootStackParamList } from '../navigation/AppNavigator';
import { FontAwesome } from '@expo/vector-icons';

// Ajuste as interfaces
interface PrestadorParaAgendar {
  id: string;
  nome: string;
  foto: string;
  idade?: number;
  horario_atendimento: string | string[];
  agendamentos: string | { data: string; hora: string; clienteId?: string }[];
}

interface ServicoSelecionado {
  descricao: string;
  preco: number;
}

// NOVO: Função auxiliar para verificar se o horário no dia selecionado já passou
const isTimeSlotInPast = (selectedDate: Date, timeSlot: string, now: Date): boolean => {
  const selectedDateString = selectedDate.toDateString();
  const nowDateString = now.toDateString();

  // Verifica se a data selecionada é hoje
  if (selectedDateString === nowDateString) {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotDateTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      hours,
      minutes
    );
    // Retorna true se o horário do slot for menor ou igual ao horário atual
    return slotDateTime <= now;
  }
  // Se não for hoje, não está "no passado" para esta verificação específica
  return false;
};


export default function TelaAgendar() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { prestador, servicoSelecionado } = route.params as {
    prestador: PrestadorParaAgendar;
    servicoSelecionado: ServicoSelecionado;
  };
  console.log("Prestador recebido na TelaAgendar:", prestador);
  console.log("Serviço Selecionado recebido na TelaAgendar:", servicoSelecionado);

  const parsedHorarioAtendimento = useMemo(() => {
    try {
      if (typeof prestador.horario_atendimento === 'string') {
        return JSON.parse(prestador.horario_atendimento) as string[];
      }
      return prestador.horario_atendimento as string[];
    } catch (e) {
      console.error("Erro ao parsear horario_atendimento:", e);
      return [];
    }
  }, [prestador.horario_atendimento]);

  const parsedAgendamentosDoPrestador = useMemo(() => {
    try {
      if (typeof prestador.agendamentos === 'string') {
        const parsed = JSON.parse(prestador.agendamentos);
        return Array.isArray(parsed) ? parsed : [];
      }
      if (Array.isArray(prestador.agendamentos)) {
        return prestador.agendamentos as { data: string; hora: string }[];
      }
      return [];
    } catch (e) {
      console.error("Erro ao parsear agendamentos do prestador:", e);
      return [];
    }
  }, [prestador.agendamentos]);

  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [horaSelecionada, setHoraSelecionada] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  const formasDePagamento = ['dinheiro', 'credito', 'debito', 'pix'];
  const [observacoes, setObservacoes] = useState('');
  const [horariosPossiveisDia, setHorariosPossiveisDia] = useState<string[]>([]);
  const [statusCarregamentoHorarios, setStatusCarregamentoHorarios] = useState<'carregando' | 'sucesso' | 'erro'>('carregando');


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
    return parsedAgendamentosDoPrestador.some(
      (ag) => ag.data === dataString && ag.hora === timeStr
    );
  }, [parsedAgendamentosDoPrestador]);


  useEffect(() => {
    const generateAllPossibleDayHours = () => {
      setStatusCarregamentoHorarios('carregando');
      console.log("Dados para gerar horários:", {
        horario_atendimento_raw: prestador.horario_atendimento,
        parsedHorario: parsedHorarioAtendimento,
        agendamentos_raw: prestador.agendamentos,
        parsedAgendamentos: parsedAgendamentosDoPrestador,
      });

      if (!parsedHorarioAtendimento || parsedHorarioAtendimento.length < 2) {
        console.warn("Prestador.horario_atendimento inválido. Não é possível gerar horários.");
        setHorariosPossiveisDia([]);
        setStatusCarregamentoHorarios('erro');
        return;
      }

      const [inicioStr, fimStr] = parsedHorarioAtendimento;
      const inicioHora = parseInt(inicioStr.split(':')[0]);
      const fimHora = parseInt(fimStr.split(':')[0]);
      console.log(`Horário de atendimento: ${inicioStr}-${fimStr}`);
      console.log(`Horas parseadas: Início=${inicioHora}, Fim=${fimHora}`);

      const allHours: string[] = [];
      for (let h = inicioHora; h < fimHora; h++) {
        const horaStr = h.toString().padStart(2, '0') + ':00';
        allHours.push(horaStr);
      }
      
      // MODIFICAÇÃO: Não estamos pré-filtrando aqui para que a UI possa desabilitar dinamicamente
      // com base no tempo real ao renderizar. A validação ocorrerá na renderização e no clique/submissão.
      setHorariosPossiveisDia(allHours);
      console.log("Horários gerados (antes de filtro de passado):", allHours);
      setHoraSelecionada('');
      setStatusCarregamentoHorarios('sucesso');
    };

    generateAllPossibleDayHours();
  }, [dataSelecionada, parsedHorarioAtendimento, parsedAgendamentosDoPrestador]);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      // Garante que a data selecionada não tenha horário (apenas data) para evitar confusão
      const newSelectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setDataSelecionada(newSelectedDate);
      setHoraSelecionada('');
    }
  };

  const handleTimeSelection = (time: string) => {
    const currentTime = new Date(); // Pega a hora atual para a validação
    if (isTimeSlotInPast(dataSelecionada, time, currentTime)) {
      Alert.alert('Horário Inválido', `O horário de ${time} no dia ${dataSelecionada.toLocaleDateString('pt-BR')} já passou. Por favor, escolha outro.`);
      return;
    }
    if (!isTimeWithinServiceHours(time)) {
      Alert.alert('Horário Inválido', `O prestador ${prestador.nome} não atende às ${time}. Horário: ${parsedHorarioAtendimento[0]} - ${parsedHorarioAtendimento[1]}.`);
      return;
    }
    if (isTimeAlreadyBooked(dataSelecionada, time)) {
      Alert.alert('Horário Ocupado', `O horário de ${time} no dia ${dataSelecionada.toLocaleDateString('pt-BR')} já está agendado. Por favor, escolha outro.`);
      return;
    }
    setHoraSelecionada(time);
  };


  const finalizarAgendamento = () => {
    if (!horaSelecionada) {
      Alert.alert('Erro', 'Selecione um horário válido.');
      return;
    }

    const currentTimeForValidation = new Date(); // Pega a hora atual para validação final

    // MODIFICAÇÃO: Adiciona validação de horário passado antes de confirmar
    if (isTimeSlotInPast(dataSelecionada, horaSelecionada, currentTimeForValidation)) {
      Alert.alert('Erro de Agendamento', `O horário selecionado (${horaSelecionada}) para hoje já passou. Por favor, escolha um horário futuro.`);
      return;
    }

    if (!isTimeWithinServiceHours(horaSelecionada)) {
      Alert.alert('Erro', `O horário selecionado (${horaSelecionada}) está fora do horário de atendimento do prestador (${parsedHorarioAtendimento[0]} - ${parsedHorarioAtendimento[1]}).`);
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
            const authInstance = getAuth();
            const currentUser = authInstance.currentUser;
            if (!currentUser) {
              Alert.alert('Erro de Autenticação', 'Você precisa estar logado para agendar. Por favor, faça login novamente.');
              navigation.navigate('TelaLogin');
              return;
            }

            const agendamentosCollectionRef = collection(db, 'agendamentos');
            const novoAgendamentoDocRef = doc(agendamentosCollectionRef); 

            const agendamentoParaSalvar = {
              id: novoAgendamentoDocRef.id, 
              data: dataSelecionada.toDateString(), 
              hora: horaSelecionada,
              servicoDescricao: servicoSelecionado.descricao,
              servicoPreco: servicoSelecionado.preco,
              formaPagamento: formaPagamento,
              observacoes: observacoes,
              clienteId: currentUser.uid, 
              prestadorId: prestador.id,
              prestadorNome: prestador.nome,
              timestampAgendamento: new Date().toISOString(),
              status: 'confirmado', 
            };

            const horarioAgendadoParaPrestador = {
              data: dataSelecionada.toDateString(),
              hora: horaSelecionada,
              clienteId: currentUser.uid, 
              agendamentoId: novoAgendamentoDocRef.id 
            };

            const prestadorRef = doc(db, 'prestadores', prestador.id);

            try {
              await runTransaction(db, async (transaction) => {
                const prestadorDocSnap = await transaction.get(prestadorRef);
                if (!prestadorDocSnap.exists()) {
                  throw new Error("Ops! Prestador não encontrado no sistema. O agendamento não pode ser concluído.");
                }
                const dadosAtuaisPrestador = prestadorDocSnap.data() as PrestadorParaAgendar;
                
                let agendamentosAtuaisNoDb: { data: string; hora: string }[] = [];
                if (dadosAtuaisPrestador.agendamentos) {
                  if (typeof dadosAtuaisPrestador.agendamentos === 'string') {
                    try {
                      const parsed = JSON.parse(dadosAtuaisPrestador.agendamentos);
                      agendamentosAtuaisNoDb = Array.isArray(parsed) ? parsed : [];
                    } catch (e) {
                      console.warn("Transação: Erro ao parsear agendamentos do prestador:", e);
                      agendamentosAtuaisNoDb = [];
                    }
                  } else if (Array.isArray(dadosAtuaisPrestador.agendamentos)) {
                    agendamentosAtuaisNoDb = dadosAtuaisPrestador.agendamentos;
                  }
                }

                // Re-verificação de horário já ocupado DENTRO da transação
                const isSlotTakenInTransaction = agendamentosAtuaisNoDb.some(
                  (ag) => ag.data === agendamentoParaSalvar.data && ag.hora === agendamentoParaSalvar.hora
                );
                if (isSlotTakenInTransaction) {
                  throw new Error(`O horário ${agendamentoParaSalvar.hora} no dia ${new Date(agendamentoParaSalvar.data).toLocaleDateString('pt-BR')} foi agendado por outra pessoa instantes atrás. Por favor, escolha outro horário.`);
                }

                // MODIFICAÇÃO: Re-verificação de horário passado DENTRO da transação (camada extra de segurança)
                const nowInTransaction = new Date();
                if (isTimeSlotInPast(dataSelecionada, agendamentoParaSalvar.hora, nowInTransaction)) {
                    throw new Error(`O horário ${agendamentoParaSalvar.hora} no dia ${new Date(agendamentoParaSalvar.data).toLocaleDateString('pt-BR')} não está mais disponível (passou). Por favor, escolha outro horário.`);
                }


                transaction.set(novoAgendamentoDocRef, agendamentoParaSalvar);
                transaction.update(prestadorRef, {
                  agendamentos: arrayUnion(horarioAgendadoParaPrestador)
                });
              });

              console.log("Agendamento salvo e prestador atualizado com ID de agendamento:", novoAgendamentoDocRef.id);
              Alert.alert('Sucesso!', 'Seu agendamento foi realizado com sucesso!');
              navigation.goBack();

            } catch (error: unknown) {
              console.error("Erro na transação de agendamento:", error);
              let errorMessage = 'Não foi possível finalizar o agendamento. ';
              if (error instanceof Error) {
                errorMessage += error.message;
              } else if (typeof error === 'string') {
                errorMessage += error;
              } else {
                errorMessage += 'Ocorreu um erro desconhecido.';
              }
              Alert.alert('Falha no Agendamento', errorMessage);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        style={styles.botaoVoltar}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <FontAwesome name="arrow-left" size={24} color="#000" />
      </TouchableOpacity>
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
            minimumDate={new Date(new Date().setHours(0, 0, 0, 0))} // Não permite selecionar datas passadas (dia inteiro)
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
            horariosPossiveisDia.map((hora) => {
              const jaAgendado = isTimeAlreadyBooked(dataSelecionada, hora);
              const foraDoHorarioDeServico = !isTimeWithinServiceHours(hora);
              // MODIFICAÇÃO: Adiciona verificação se o horário já passou para desabilitar o botão
              const currentTime = new Date(); // Pega a hora atual para renderização
              const horarioJaPassou = isTimeSlotInPast(dataSelecionada, hora, currentTime);
              
              const desabilitado = jaAgendado || foraDoHorarioDeServico || horarioJaPassou;

              return (
                <TouchableOpacity
                  key={hora}
                  disabled={desabilitado}
                  style={[
                    styles.timeSlotButton,
                    hora === horaSelecionada && !desabilitado && styles.selectedTimeSlot, // Só aplica selected se não estiver desabilitado
                    desabilitado && styles.bookedTimeSlot, // Estilo genérico para desabilitado
                    horarioJaPassou && !jaAgendado && !foraDoHorarioDeServico && styles.pastTimeSlot, // Estilo específico se só passou (opcional)
                  ]}
                  onPress={() => handleTimeSelection(hora)}
                >
                  <Text style={[
                    styles.timeSlotText,
                    hora === horaSelecionada && !desabilitado && styles.selectedTimeSlotText,
                    desabilitado && styles.bookedTimeSlotText,
                    horarioJaPassou && !jaAgendado && !foraDoHorarioDeServico && styles.pastTimeSlotText, // opcional
                  ]}>
                    {hora}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            statusCarregamentoHorarios === 'sucesso' && horariosPossiveisDia.length === 0 && (
              <Text style={styles.infoText}>Nenhum horário disponível para esta data dentro do período de atendimento ou todos já passaram.</Text>
            )
          )}
        </View>

        <Text style={styles.sectionTitle}>Forma de pagamento</Text>
        <RadioButton.Group onValueChange={setFormaPagamento} value={formaPagamento}>
        <View style={styles.radioGroupWrapper}>
          {formasDePagamento.map((opcao) => (
            <View key={opcao} style={styles.radioButtonContainer}>
              <RadioButton value={opcao} color="#007BFF"/>
              <Text>{opcao.charAt(0).toUpperCase() + opcao.slice(1)}</Text>
            </View>
          ))}
        </View>
        </RadioButton.Group>

        <Text style={styles.sectionTitle}>Observações (opcional)</Text>
        <TextInput
          multiline
          maxLength={300}
          value={observacoes}
          onChangeText={setObservacoes}
          placeholder="Insira alguma observação para o prestador"
          style={styles.observationsInput}
        />

        <TouchableOpacity
          style={styles.finalizarButton}
          onPress={finalizarAgendamento}
        >
          <Text style={styles.finalizarButtonText}>FINALIZAR AGENDAMENTO</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40, 
  },
  prestadorImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: 32,
    alignSelf: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#007BFF',
  },
  prestadorInfoBox: {
    backgroundColor: '#F0F8FF', 
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center', 
    borderWidth: 1,
    borderColor: '#D1E9FF',
  },
  prestadorName: {
    fontWeight: 'bold',
    fontSize: 18, 
    color: '#333',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 15,
    color: '#555',
    marginBottom: 2,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  sectionTitle: {
    marginTop: 15,
    fontWeight: 'bold',
    fontSize: 17, 
    marginBottom: 10, 
    color: '#444',
  },
  datePickerButton: {
    padding: 15, 
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginTop: 5,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#007BFF', 
    fontWeight: '500',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10, 
    marginVertical: 10,
    minHeight: 50, 
  },
  timeSlotButton: {
    paddingVertical: 12, 
    paddingHorizontal: 18, 
    backgroundColor: '#E9ECEF', 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CED4DA', 
  },
  selectedTimeSlot: {
    backgroundColor: '#007BFF',
    borderColor: '#0056b3', 
  },
  bookedTimeSlot: { // Estilo para qualquer horário desabilitado (ocupado, fora de serviço, ou passado)
    backgroundColor: '#e0e0e0', // Um cinza mais escuro para indicar desabilitado
    borderColor: '#c0c0c0',
  },
  pastTimeSlot: { // Estilo específico se APENAS passou (opcional, sobrepõe bookedTimeSlot se necessário)
    // Se quiser um estilo visual diferente SÓ porque passou (e não por outros motivos)
     backgroundColor: '#fcf8e3', // Exemplo: um amarelo bem claro
    // borderColor: '#faebcc',
  },
  timeSlotText: {
    color: '#212529', 
    fontWeight: 'bold',
    fontSize: 15,
  },
  selectedTimeSlotText: {
    color: 'white',
  },
  bookedTimeSlotText: { // Texto para qualquer horário desabilitado
    color: '#888888', // Cinza para o texto
    textDecorationLine: 'none', // Ou 'line-through' se preferir
  },
  pastTimeSlotText: { // opcional
    // color: '#8a6d3b', // Exemplo: cor para texto de horário passado
  },
  infoText: {
    color: '#6C757D', 
    marginTop: 10, 
    width: '100%',
    textAlign: 'center', 
    fontSize: 14,
  },
  warningText: {
    color: '#DC3545', 
    fontWeight: 'bold',
  },
  radioGroupWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start', 
    marginBottom: 10, 
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15, 
    marginBottom: 10, 
  },
  observationsInput: {
    minHeight: 100, 
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12, 
    paddingTop: 10, 
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    fontSize: 15,
    marginBottom: 20, 
  },
  finalizarButton: {
    marginTop: -10, 
    backgroundColor: '#28A745', 
    paddingVertical: 8, 
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: "#000", 
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  finalizarButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textTransform: 'uppercase',
  },
  botaoVoltar: {
    position: 'absolute',
    top: 48, // Ajuste para diferentes plataformas
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
});