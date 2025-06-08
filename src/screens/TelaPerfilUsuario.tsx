// src/screens/TelaPerfilUser.tsx

import React, { useState, useEffect, useRef } from 'react'; // Importar useRef
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { Button, TextInput, IconButton, Surface } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import { updateEmail, signOut, sendEmailVerification } from 'firebase/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';

interface UserData {
  nome: string;
  email: string;
  telefone: string;
  bairro: string;
  cep: string;
  cidade: string;
  complemento: string;
  estado: string;
  rua: string;
  numero: string;
  semNumero: boolean;
  cpf: string;
  fotoPerfilUrl?: string; 
}

const TelaPerfilUser: React.FC = () => {
  const navigation = useNavigation();

  const initialUserDataState: UserData = {
    nome: '', email: '', telefone: '', bairro: '', cep: '', cidade: '',
    complemento: '', estado: '', rua: '', numero: '', semNumero: false, cpf: '',
    fotoPerfilUrl: undefined,
  };

  const [userData, setUserData] = useState<UserData>(initialUserDataState);
  const [originalUserData, setOriginalUserData] = useState<UserData>(initialUserDataState);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // NOVO: Ref para o timeout do alerta de e-mail
  const emailAlertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        Alert.alert("Erro", "Nenhum usuário autenticado encontrado.");
        return;
      }

      try {
        const userRef = doc(db, 'usuarios', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data() as UserData;
          setUserData(data);
          setOriginalUserData(data);
          setImageUri(auth.currentUser.photoURL || null); 
        } else {
          const newUserData: UserData = {
            ...initialUserDataState,
            nome: auth.currentUser.displayName || '',
            email: auth.currentUser.email || '',
            fotoPerfilUrl: auth.currentUser.photoURL || undefined, 
          };
          await setDoc(userRef, newUserData);
          setUserData(newUserData);
          setOriginalUserData(newUserData);
          setImageUri(newUserData.fotoPerfilUrl || null);
          Alert.alert("Bem-vindo!", "Seu perfil foi criado. Por favor, complete seus dados.");
        }
      } catch (error: any) {
        console.error("Erro ao carregar dados do usuário:", error);
        Alert.alert("Erro", "Não foi possível carregar seus dados: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // Limpar o timeout se o componente for desmontado
    return () => {
      if (emailAlertTimeoutRef.current) {
        clearTimeout(emailAlertTimeoutRef.current);
      }
    };
  }, []);

  const handleEditToggle = () => {
    if (isEditing) {
      setUserData(originalUserData);
      setImageUri(auth.currentUser?.photoURL || null); 
    }
    setIsEditing(!isEditing);
  };

  const pickImage = async () => {
    if (!isEditing) return;

    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();

    if (mediaLibraryStatus !== 'granted' || cameraStatus !== 'granted') {
      Alert.alert('Permissão necessária', 'Desculpe, precisamos de permissões da galeria e câmera para isso funcionar!');
      return;
    }

    Alert.alert(
      "Selecionar Imagem",
      "Escolha uma opção",
      [
        {
          text: "Galeria",
          onPress: async () => {
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 1,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setImageUri(result.assets[0].uri);
            }
          },
        },
        {
          text: "Câmera",
          onPress: async () => {
            let result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 1,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setImageUri(result.assets[0].uri);
            }
          },
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;

    setLoading(true);
    let emailUpdateAttempted = false; 
    let emailUpdateSuccess = false; // NOVO: Flag para sucesso na atualização do e-mail Auth
    let emailErrorMessage: string | null = null; // NOVO: Para armazenar mensagem de erro do e-mail

    try {
      const userRef = doc(db, 'usuarios', auth.currentUser.uid);
      const dataToSave: Partial<Omit<UserData, 'fotoPerfilUrl'>> = { ...userData }; 

      if (auth.currentUser.email !== userData.email) {
        emailUpdateAttempted = true; 
        if (userData.email) { 
          try {
            await updateEmail(auth.currentUser, userData.email);
            await sendEmailVerification(auth.currentUser); 
            emailUpdateSuccess = true; // E-mail Auth atualizado com sucesso
            
            // Não fazemos o Alert.alert aqui ainda. O encadeamento virá depois.
            
            setOriginalUserData(prev => ({ ...prev, email: userData.email }));
            // dataToSave.email já contem o novo email
          } catch (error: any) {
            console.error("Erro ao atualizar e-mail no Firebase Auth:", error);
            if (error.code === 'auth/requires-recent-login') {
              emailErrorMessage = "Por segurança, para alterar seu e-mail, você precisa fazer login novamente. Por favor, faça logout e login e tente novamente.";
            } else if (error.code === 'auth/invalid-email') {
              emailErrorMessage = "O novo e-mail fornecido é inválido.";
            } else if (error.code === 'auth/email-already-in-use') {
              emailErrorMessage = "O e-mail fornecido já está sendo usado por outra conta.";
            } else {
              emailErrorMessage = "Não foi possível atualizar seu e-mail: " + error.message;
            }
            
            dataToSave.email = originalUserData.email; 
            setUserData(prev => ({ ...prev, email: originalUserData.email }));
          }
        } else {
            emailErrorMessage = "O campo de e-mail não pode ser vazio.";
            dataToSave.email = originalUserData.email;
            setUserData(prev => ({ ...prev, email: originalUserData.email }));
        }
      }

      // Salva os dados do perfil no Firestore (exceto fotoPerfilUrl)
      await setDoc(userRef, dataToSave, { merge: true });
      setOriginalUserData(dataToSave as UserData); 
      setIsEditing(false);

      // NOVO: Encadear os alertas
      if (emailUpdateAttempted && emailErrorMessage) {
          // Se houve um erro na atualização do e-mail
          Alert.alert("Erro ao Atualizar E-mail", emailErrorMessage);
      } else if (emailUpdateAttempted && emailUpdateSuccess) {
          // Se o e-mail foi atualizado com sucesso no Auth e e-mail de verificação enviado
          Alert.alert(
              "E-mail Atualizado - Requer Verificação",
              `Seu e-mail foi atualizado para ${userData.email}. Por favor, verifique sua caixa de entrada e clique no link de verificação para confirmar a alteração. Você será desconectado e precisará fazer login com o novo e-mail APÓS a verificação.`,
              [
                  { text: "OK", onPress: async () => {
                      // Após o usuário clicar OK na mensagem de e-mail, fazemos logout
                      // Isso garante que o usuário precisa verificar o e-mail para logar novamente
                      await signOut(auth);
                      navigation.dispatch(
                          CommonActions.reset({
                              index: 0,
                              routes: [{ name: 'TelaLogin' }],
                          })
                      );
                  }}
              ]
          );
      } else {
          // Se não houve tentativa de atualização de e-mail ou outras informações foram salvas
          Alert.alert('Sucesso', 'Seu perfil foi atualizado!');
      }

    } catch (error: any) {
      console.error("Erro ao salvar perfil:", error);
      Alert.alert("Erro", "Não foi possível salvar seu perfil: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'TelaLogin' }],
        })
      );
    } catch (error: any) {
      console.error("Erro ao fazer logout:", error);
      Alert.alert("Erro", "Não foi possível fazer logout: " + error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.profileCard} elevation={2}>
        <IconButton
          icon="arrow-left"
          size={30}
          onPress={() => navigation.goBack()}
          style={styles.backButtonInsideCard}
        />
        <IconButton
          icon={isEditing ? "close-circle-outline" : "pencil-outline"}
          iconColor={isEditing ? 'red' : 'gray'}
          size={30}
          onPress={handleEditToggle}
          style={styles.editButtonInsideCard}
        />

        <View style={styles.profileImageContainer}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.profileImage}
            />
          ) : (
            <MaterialCommunityIcons name="account-circle" size={120} color="gray" />
          )}
          {isEditing && (
            <IconButton
              icon="camera"
              iconColor="white"
              size={30}
              onPress={pickImage}
              style={styles.cameraIcon}
            />
          )}
        </View>

        <TextInput
          label="Nome"
          value={userData.nome}
          onChangeText={(text) => setUserData(prev => ({ ...prev, nome: text }))}
          mode="outlined"
          style={styles.input}
          disabled={!isEditing}
        />
        <TextInput
          label="Email"
          value={userData.email}
          onChangeText={(text) => setUserData(prev => ({ ...prev, email: text }))}
          mode="outlined"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          disabled={!isEditing}
        />
        <TextInput
          label="Telefone"
          value={userData.telefone}
          onChangeText={(text) => setUserData(prev => ({ ...prev, telefone: text }))}
          mode="outlined"
          style={styles.input}
          keyboardType="phone-pad"
          disabled={!isEditing}
        />
        <TextInput
          label="CPF"
          value={userData.cpf}
          onChangeText={(text) => setUserData(prev => ({ ...prev, cpf: text }))}
          mode="outlined"
          style={styles.input}
          disabled={!isEditing}
          keyboardType="numeric"
          maxLength={11}
        />

        <TextInput
          label="Rua"
          value={userData.rua}
          onChangeText={(text) => setUserData(prev => ({ ...prev, rua: text }))}
          mode="outlined"
          style={styles.input}
          disabled={!isEditing}
        />
        <TextInput
          label="Número"
          value={userData.numero}
          onChangeText={(text) => setUserData(prev => ({ ...prev, numero: text }))}
          mode="outlined"
          style={styles.input}
          disabled={!isEditing}
          keyboardType="numeric"
        />
        <TextInput
          label="Complemento"
          value={userData.complemento}
          onChangeText={(text) => setUserData(prev => ({ ...prev, complemento: text }))}
          mode="outlined"
          style={styles.input}
          disabled={!isEditing}
        />
        <TextInput
          label="Bairro"
          value={userData.bairro}
          onChangeText={(text) => setUserData(prev => ({ ...prev, bairro: text }))}
          mode="outlined"
          style={styles.input}
          disabled={!isEditing}
        />
        <TextInput
          label="Cidade"
          value={userData.cidade}
          onChangeText={(text) => setUserData(prev => ({ ...prev, cidade: text }))}
          mode="outlined"
          style={styles.input}
          disabled={!isEditing}
        />
        <TextInput
          label="Estado"
          value={userData.estado}
          onChangeText={(text) => setUserData(prev => ({ ...prev, estado: text }))}
          mode="outlined"
          style={styles.input}
          disabled={!isEditing}
          maxLength={2}
          autoCapitalize="characters"
        />
        <TextInput
          label="CEP"
          value={userData.cep}
          onChangeText={(text) => setUserData(prev => ({ ...prev, cep: text }))}
          mode="outlined"
          style={styles.input}
          disabled={!isEditing}
          keyboardType="numeric"
          maxLength={8}
        />

        {isEditing ? (
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.actionButton}
            loading={loading}
            disabled={loading}
          >
            Salvar
          </Button>
        ) : (
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.actionButton}
            loading={loading}
            disabled={loading}
          >
            Sair (Logout)
          </Button>
        )}
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 3,
    top:38,
    bottom: 30,
    
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  backButtonInsideCard: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
  },
  editButtonInsideCard: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 40,
  },
  input: {
    width: '100%',
    marginBottom: 10,
  },
  actionButton: {
    marginTop: 10,
    marginBottom: 10,
    width: '80%',
  },
});

export default TelaPerfilUser;