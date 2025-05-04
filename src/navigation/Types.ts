export type RootStackParamList = {
    TelaLogin: undefined;
    TelaCadastro: undefined;
    TelaRecuperarSenha: undefined;
    TelaValidacaoUser: {
      userData: {
        uid: string;
        nome: string;
        cpf: string;
        telefone: string;
        email: string;
        cep: string;
        rua: string;
        numero: string;
        complemento: string;
        bairro: string;
        cidade: string;
        estado: string;
        semNumero: boolean;
      };
    };
    MainTabs: undefined;
    // Adicione aqui outras telas do seu app
  };
  