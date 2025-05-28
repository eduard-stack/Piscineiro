// scripts/criarAgendamento.ts

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";

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

const criarAgendamento = async () => {
  try {
    const docRef = await addDoc(collection(db, 'agendamentos'), {
      id_usuario: 'usuario_teste_123',
      id_prestador: 'prestador_teste_456',
      nome_servico: 'Limpeza de Piscina',
      preco_servico: 120,
      data: '2025-06-01',
      horario: '10:00',
      forma_pagamento: 'Pix',
      status: 'pendente',
      criado_em: Timestamp.now(),
    });

    console.log('Agendamento criado com ID:', docRef.id);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
  }
};

criarAgendamento();
