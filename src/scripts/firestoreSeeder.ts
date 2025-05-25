// firestoreSeeder.ts
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCwsYzWZuS_pLfDusAY42FXhg4tQMQ03iI",
  authDomain: "piscineiro-68ac1.firebaseapp.com",
  projectId: "piscineiro-68ac1",
  storageBucket: "piscineiro-68ac1.firebasestorage.app",
  messagingSenderId: "231844613305",
  appId: "1:231844613305:web:50fe264b8cbccfc0d95f68"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

type Servico = {
  descricao: string;
  preco: number;
};

type Prestador = {
  nome: string;
  sexo: "masculino" | "feminino";
  idade: number;
  telefone: string;
  email: string;
  cpf: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  foto: string;
  cidades_atendidas: string[];
  horario_atendimento: string;
  servicos: Servico[];
};

const prestadores: Prestador[] = [
  {
    nome: "João Carlos",
    sexo: "masculino",
    idade: 32,
    telefone: "+55 (084) 2677 5052",
    email: "azevedoleonardo@hotmail.com",
    cpf: "648.257.103-44",
    cep: "36200-000",
    rua: "Viaduto Ramos",
    numero: "62",
    bairro: "Centro",
    cidade: "Barbacena",
    estado: "MG",
    foto: "",
    cidades_atendidas: ["Barbacena"],
    horario_atendimento: "08:00 – 18:00",
    servicos: [
      { descricao: "Limpeza de piscina até 2 x 4", preco: 150 },
      { descricao: "Limpeza de piscina até 5 x 9", preco: 180 },
      { descricao: "Limpeza de revestimento até 2 x 4", preco: 300 },
      { descricao: "Limpeza de revestimento até 5 x 9", preco: 360 }
    ]
  },
  {
    nome: "Paulo da Silva",
    sexo: "masculino",
    idade: 36,
    telefone: "(084) 1805 3493",
    email: "eviana@ribeiro.net",
    cpf: "924.316.750-25",
    cep: "36215-000",
    rua: "Favela de Dias",
    numero: "440",
    bairro: "Centro",
    cidade: "Santa Bárbara do Tugúrio",
    estado: "MG",
    foto: "",
    cidades_atendidas: ["Santa Bárbara do Tugúrio"],
    horario_atendimento: "08:00 – 18:00",
    servicos: [
      { descricao: "Limpeza de piscina até 2 x 4", preco: 150 },
      { descricao: "Limpeza de piscina até 5 x 9", preco: 180 },
      { descricao: "Limpeza de revestimento até 2 x 4", preco: 300 },
      { descricao: "Limpeza de revestimento até 5 x 9", preco: 360 }
    ]
  },
  {
    nome: "Pedro Lucas",
    sexo: "masculino",
    idade: 41,
    telefone: "+55 (071) 9521-3578",
    email: "pbarros@ferreira.com",
    cpf: "756.318.092-30",
    cep: "36200-000",
    rua: "Sítio Lara Ramos",
    numero: "370",
    bairro: "Centro",
    cidade: "Barbacena",
    estado: "MG",
    foto: "",
    cidades_atendidas: ["Barbacena", "Santa Bárbara do Tugúrio"],
    horario_atendimento: "08:00 – 18:00",
    servicos: [
      { descricao: "Limpeza de piscina até 2 x 4", preco: 150 },
      { descricao: "Limpeza de piscina até 5 x 9", preco: 180 },
      { descricao: "Limpeza de revestimento até 2 x 4", preco: 300 },
      { descricao: "Limpeza de revestimento até 5 x 9", preco: 360 }
    ]
  },
  {
    nome: "Carlos Mendes",
    sexo: "masculino",
    idade: 49,
    telefone: "41 7942 6684",
    email: "gabrielacunha@yahoo.com.br",
    cpf: "524.683.790-47",
    cep: "36200-000",
    rua: "Alameda de das Neves",
    numero: "160",
    bairro: "Centro",
    cidade: "Barbacena",
    estado: "MG",
    foto: "",
    cidades_atendidas: ["Barbacena", "Santa Bárbara do Tugúrio", "Barroso"],
    horario_atendimento: "08:00 – 18:00",
    servicos: [
      { descricao: "Limpeza de piscina até 2 x 4", preco: 150 },
      { descricao: "Limpeza de piscina até 5 x 9", preco: 180 },
      { descricao: "Limpeza de revestimento até 2 x 4", preco: 300 },
      { descricao: "Limpeza de revestimento até 5 x 9", preco: 360 }
    ]
  }
];

const seedPrestadores = async () => {
  for (const prestador of prestadores) {
    try {
      await addDoc(collection(db, "prestadores"), prestador);
      console.log(`✅ Prestador ${prestador.nome} inserido com sucesso!`);
    } catch (error) {
      console.error(`❌ Erro ao inserir ${prestador.nome}:`, error);
    }
  }
};

seedPrestadores();
// Para executar este script, você pode usar o Node.js. Certifique-se de ter o Firebase SDK instalado: