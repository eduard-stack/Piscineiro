import { db } from '../services/firebaseConfig'; // ajuste o caminho conforme seu projeto
import { doc, setDoc, deleteDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Adiciona um favorito no Firestore
export async function adicionarFavorito(prestadorId: string): Promise<void> {
  const auth = getAuth();
  const usuarioId = auth.currentUser?.uid;
  if (!usuarioId) return;

  const docId = `${usuarioId}_${prestadorId}`;
  const docRef = doc(db, 'favoritos', docId);

  await setDoc(docRef, {
    usuarioId,
    prestadorId,
    criadoEm: new Date(),
  });
}

// Remove um favorito do Firestore
export async function removerFavorito(prestadorId: string): Promise<void> {
  const auth = getAuth();
  const usuarioId = auth.currentUser?.uid;
  if (!usuarioId) return;

  const docId = `${usuarioId}_${prestadorId}`;
  const docRef = doc(db, 'favoritos', docId);

  await deleteDoc(docRef);
}

// Verifica se um prestador é favorito
export async function estaFavorito(prestadorId: string): Promise<boolean> {
  const auth = getAuth();
  const usuarioId = auth.currentUser?.uid;
  if (!usuarioId) return false;

  const docId = `${usuarioId}_${prestadorId}`;
  const docRef = doc(db, 'favoritos', docId);

  const docSnap = await getDoc(docRef);
  return docSnap.exists();
}

// Busca todos os favoritos do usuário logado
export async function getFavoritos(): Promise<string[]> {
  const auth = getAuth();
  const usuarioId = auth.currentUser?.uid;
  if (!usuarioId) return [];

  const favoritosRef = collection(db, 'favoritos');
  const q = query(favoritosRef, where('usuarioId', '==', usuarioId));
  const querySnapshot = await getDocs(q);

  const favoritos: string[] = [];
  querySnapshot.forEach((doc) => {
    favoritos.push(doc.data().prestadorId);
  });

  return favoritos;
}
