import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE_FAVORITOS = 'favoritos';

export async function getFavoritos(): Promise<string[]> {
  const json = await AsyncStorage.getItem(CHAVE_FAVORITOS);
  return json ? JSON.parse(json) : [];
}

export async function adicionarFavorito(id: string): Promise<void> {
  const favoritos = await getFavoritos();
  if (!favoritos.includes(id)) {
    favoritos.push(id);
    await AsyncStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(favoritos));
  }
}

export async function removerFavorito(id: string): Promise<void> {
  let favoritos = await getFavoritos();
  favoritos = favoritos.filter((favId: string) => favId !== id);
  await AsyncStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(favoritos));
}

export async function estaFavorito(id: string): Promise<boolean> {
  const favoritos = await getFavoritos();
  return favoritos.includes(id);
}
