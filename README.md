Piscineiro App
Este repositório contém o código-fonte do aplicativo "Piscineiro", uma aplicação mobile desenvolvida em React Native para conectar clientes que precisam de serviços de piscina a prestadores de serviço.

Funcionalidades Principais
Busca de Prestadores por Cidade: Permite que o usuário pesquise prestadores de serviço com base na cidade de atendimento (TelaSearch.tsx).
Listagem de Prestadores: Visualização dos prestadores de serviço de piscina encontrados.
Detalhes do Prestador: Tela com informações detalhadas de um prestador, incluindo serviços e horários de atendimento.
Agendamento de Serviços: Funcionalidade para agendar serviços com prestadores.
Autenticação de Usuário: Gerenciamento de usuários via Firebase Authentication.
Funcionalidade de Agendamento de Serviços (com Persistência)
Esta seção detalha a funcionalidade de agendamento, que inclui a persistência dos dados.

Descrição da Funcionalidade com Persistência Implementada
A funcionalidade de agendamento permite que um cliente logado selecione um prestador, escolha uma data e um horário disponível, defina a forma de pagamento e adicione observações para o serviço. Uma vez confirmado, o agendamento é salvo no banco de dados, garantindo que a informação seja persistente e possa ser recuperada posteriormente.

Atualmente, o fluxo de persistência para o agendamento funciona da seguinte forma:
O cliente, após pesquisar por uma cidade na TelaSearch.tsx, seleciona um prestador na TelaPerfilPrestador.
Na TelaAgendar, o cliente escolhe a data, horário, forma de pagamento e adiciona observações.
Ao confirmar, um novo documento é criado na coleção agendamentos no Firebase Firestore, contendo todos os detalhes do serviço agendado (ID do cliente, ID do prestador, data, hora, serviço, preço, forma de pagamento, observações, timestamp e status inicial como 'pendente').
Além de salvar na coleção agendamentos, uma transação atômica é utilizada para atualizar o documento do prestador correspondente na coleção prestadores. Esta transação adiciona o horário recém-agendado a um mapa horariosOcupados dentro do documento do prestador, por data, para marcar o horário como indisponível.
Em caso de tentativa de agendamento de um horário já ocupado, a transação detecta o conflito e informa o usuário.

No futuro:
A exclusão de um agendamento resultará na remoção do documento da coleção agendamentos e na atualização do campo horariosOcupados no documento do prestador, liberando o horário para novos agendamentos.
A visualização de horários ocupados na UI será diretamente atualizada com base na leitura desses dados do documento do prestador.
Tecnologia Utilizada para Persistência e Justificativa da Escolha
Tecnologia: Firebase Firestore (NoSQL Document Database).
Justificativa da Escolha:
Sincronização em Tempo Real: O Firestore oferece sincronização de dados em tempo real, o que é ideal para aplicativos onde as informações (como a disponibilidade de horários) precisam ser atualizadas instantaneamente para todos os usuários.
Escalabilidade: Como um banco de dados NoSQL baseado em documentos, o Firestore é altamente escalável e flexível, permitindo armazenar dados de forma análoga à estrutura de objetos da aplicação.
Integração com Firebase: Dada a utilização do Firebase Authentication para gerenciamento de usuários, a escolha do Firestore se alinha perfeitamente com o ecossistema Firebase, simplificando a integração e a gestão de permissões (Security Rules).
Transações: O Firestore suporta transações atômicas, que são cruciais para garantir a consistência dos dados em operações que envolvem múltiplas escritas, como verificar a disponibilidade de um horário e então reservá-lo, evitando agendamentos duplos.
Instruções para Testar o Recurso no App
Para testar a funcionalidade de agendamento:

Pré-requisitos:
Certifique-se de ter Node.js, npm/Yarn e o Expo CLI (se estiver usando Expo) instalados.
Clone este repositório: git clone <https://https://github.com/eduard-stack/Piscineiro/tree/main>
Navegue até a pasta do projeto: cd Piscineiro
Instale as dependências: npm install
Certifique-se de que sua configuração do Firebase (firebaseConfig.js ou similar) está correta e que as coleções agendamentos, prestadores e clientes existem no seu projeto Firebase Firestore.
Iniciar o Aplicativo:

Execute o comando para iniciar o Metro Bundler: npx expo start (se estiver usando Expo) ou npx react-native start (se for CLI puro).
Abra o aplicativo em um emulador ou dispositivo físico (escaneando o QR code com o Expo Go ou construindo o app).

Fluxo de Teste de Agendamento:
Login: Faça login com uma conta de cliente existente. Se não tiver uma, registre-se primeiro.
Pesquisar Prestador: Na TelaSearch.tsx, digite uma cidade de atendimento (ex: "Barbacena" ou "Santa Bárbara do Tugúrio", conforme seus dados de prestador) e inicie a busca para listar os prestadores.
Selecione um Prestador: Clique em um dos cards de prestadores na tela de resultados para ver seus detalhes (TelaPerfilPrestador).
Iniciar Agendamento: Na TelaPerfilPrestador, procure pelo botão ou opção para "Agendar Serviço" (este botão deve levar para a TelaAgendar).
Preencher Dados na TelaAgendar:
Selecionar Dia: Clique no campo de data e escolha um dia no calendário.
Selecionar Horário: Escolha um horário disponível na lista de horários.
Forma de Pagamento: Selecione uma das opções de rádio button (Dinheiro, Crédito, Débito, Pix).
Observações: Opcional, digite alguma observação no campo de texto.
Confirmar: Clique no botão "Confirmar" (ou "Agendar").
Verificação:
Um alerta de "Sucesso" deve aparecer, confirmando o agendamento.
Verifique no console do Firebase (Firestore) se um novo documento foi criado na coleção agendamentos com os dados inseridos.
Verifique também no documento do prestador (coleção prestadores) se o campo horariosOcupados foi atualizado para incluir o horário recém-agendado para a data correspondente.
Teste de Horário Ocupado:

Tente agendar novamente o mesmo horário para o mesmo prestador e mesma data.
O aplicativo deve exibir um alerta de erro informando que o horário já está agendado, e o agendamento não deve ser duplicado no Firestore.
