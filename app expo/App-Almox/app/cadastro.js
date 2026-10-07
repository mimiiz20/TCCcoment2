import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Card } from 'react-native-paper';
import { useFonts } from '@expo-google-fonts/inter';
import { Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Poppins_700Bold } from '@expo-google-fonts/poppins';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';

export default function Cadastro() {

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
    Montserrat_400Regular,
    Montserrat_700Bold,
    Poppins_700Bold,
  });

    const [usuario, setUsuario] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    
    const [usuarioFocus, setUsuarioFocus] = useState(false);
    const [emailFocus, setEmailFocus] = useState(false);
    const [senhaFocus, setSenhaFocus] = useState(false);
    const [nomeUsuario, setNomeUsuario] = useState('');
    const [tipoUsuario, setTipoUsuario] = useState('');

    useFocusEffect(
      useCallback(() => {
        const carregarUsuario = async () => {
          const nome = await AsyncStorage.getItem('nomeUsuario');
          const tipo = await AsyncStorage.getItem('tipoUsuario');

          setNomeUsuario(nome || '');
          setTipoUsuario(tipo || '');
        };

        carregarUsuario();
      }, [])
    );

    const cadastrarUsuario = async () => {
    try {
    if (!usuario || !email || !senha) {
    Alert.alert('Atenção', 'Preencha todos os campos.');
    return;
    }

    const resposta = await fetch('http://10.154.20.25:5000/cadastro_app', {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json',
    },
    body: JSON.stringify({
    user: usuario,
    email: email,
    senha: senha,
    }),
    });

    const dados = await resposta.json();

    console.log('STATUS:', resposta.status);
    console.log('RESPOSTA DO SERVIDOR:', dados);
    
    if (!resposta.ok) {
    Alert.alert('Erro', dados.mensagem || 'Não foi possível cadastrar.');
    return;
    }

    Alert.alert('Sucesso', dados.mensagem);

    setUsuario('');
    setEmail('');
    setSenha('');

    router.replace('/contas');

    } catch (erro) {
    console.log('ERRO:', erro);
    Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    }
    };

  var [menuAberto, setMenuAberto] = useState(false);

  return (
    <View style={styles.background}>

      {/* NAVBAR */}
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuAberto(!menuAberto)}
        >
          <MaterialIcons
            name="menu"
            size={30}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/tabela')}>
          <Text style={tipoUsuario === 'admin' ? styles.link : styles.linkUsuario}>
            ESTOQUE
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/editar')}>
          <Text style={tipoUsuario === 'admin' ? styles.link : styles.linkUsuario}>
            EDITAR
          </Text>
        </TouchableOpacity>

        {tipoUsuario === 'admin' && (
          <>
            <TouchableOpacity
              onPress={() => router.push('/contas')}
            >
              <Text style={styles.link}>
                CONTAS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/cadastro')}
            >
              <Text style={styles.link}>
                CADASTRO
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* SIDEBAR */}
      {menuAberto && (
        <View style={styles.sidebar}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setMenuAberto(false)}
          >
            <MaterialIcons
              name="close"
              size={25}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.sidebarTitulo}>USUÁRIO</Text>
          <Text style={styles.usuario}>{nomeUsuario}</Text>
          <Text style={styles.tipo}>
            {tipoUsuario === 'admin' ? 'Administrador' : 'Usuário'}
          </Text>

          <TouchableOpacity
            style={styles.logout}
            onPress={() => router.replace('/login')}
          >
            <MaterialIcons
              name="logout"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.logoutTexto}>DESLOGAR</Text>
          </TouchableOpacity>
        </View>
      )}

      <View>
        <Text style={styles.titulo}>
          {"Boas-vindas ao\nCadastro de Usuários!"} {/* \n serve pra quebrar a linha, "Cadastro de Usuários!" fica embaixo de "Boas-vindas ao"*/}
        </Text>

        {/* FORMULÁRIO DE CADASTRO DE USUÁRIOS */}
        <Card style={styles.card}>

          <Text style={styles.label}>USUÁRIO</Text>

          <TextInput
            placeholder="Digite o usuário"
            style={[
              styles.input_user,
              usuarioFocus && styles.inputFocus
            ]}
            value={usuario}
            onChangeText={setUsuario}
            onFocus={() => setUsuarioFocus(true)}
            onBlur={() => setUsuarioFocus(false)}
          />

          <Text style={styles.label}>E-MAIL</Text>

          <TextInput
            placeholder="Digite o email"
            style={[
              styles.input_email,
              emailFocus && styles.inputFocus
            ]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            onFocus={() => setEmailFocus(true)}
            onBlur={() => setEmailFocus(false)}
          />

          <Text style={styles.label}>SENHA</Text>

          <TextInput
            placeholder="Digite a senha"
            style={[
              styles.input_senha,
              senhaFocus && styles.inputFocus
            ]}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            onFocus={() => setSenhaFocus(true)}
            onBlur={() => setSenhaFocus(false)}
          />


                <TouchableOpacity
                    style={styles.botao}
                    onPress={cadastrarUsuario}
                    >
                    <Text style={styles.btntexto}>CADASTRAR</Text>
                    </TouchableOpacity>

                </Card>
            </View>
            </View>
        );
        }

const styles = StyleSheet.create({

    background: {
        flex: 1,
        backgroundColor: '#F0F1F2',
    },
    menuButton: {
        marginRight: 10,
    },
    titulo: {
    fontSize: 25,
    textAlign: 'center',
    color: '#1D3273',
    marginBottom: 105,
    fontFamily: 'Poppins_700Bold',
    },
    navbar: {
        height: 60,
        backgroundColor: '#1D3273',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingLeft: 10,
        marginTop: 30,
        marginBottom: 30,
        zIndex: 10,
    },

    link: {
      color: '#FFFFFF',
      fontSize: 14,
      marginLeft: 22,
      fontFamily: 'Poppins_700Bold',
    },

    linkUsuario: {
      color: '#FFFFFF',
      fontSize: 14,
      marginLeft: 80,
      fontFamily: 'Poppins_700Bold',
    },

    sidebar: {
        position: 'absolute',
        left: 0,
        top: 30,
        width: 250,
        height: '100%',
        backgroundColor: '#1D3273',
        zIndex: 100,
        paddingTop: 20,
        paddingHorizontal: 20,
    },
    sidebarTitulo: {
        color: '#FFFFFF',
        fontSize: 22,
        fontFamily: 'Poppins_700Bold',
        marginBottom: 30,
    },
    usuario: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'Poppins_700Bold',
        marginBottom: 5,
    },
    tipo: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Montserrat_400Regular',
        marginBottom: 30,
    },
    logout: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.3)',
    },
    logoutTexto: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Poppins_700Bold',
    },
    closeButton: {
        position: 'absolute',
        right: 10,
        top: 2,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        justifyContent: 'center',
        marginLeft: 40,
        marginRight: 40,
        borderWidth: 2,
        borderColor: '#F28705',
        borderRadius: 8,
        overflow: 'hidden',
    },
    label: {
      color: '#1D3273',
      fontFamily: 'Poppins_700Bold',
      fontSize: 14,
      marginBottom: 5,
      width: 240,
      alignSelf: 'center',
    },

  input: {
    width: 240,
    height: 40,
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 5,
    borderWidth: 0,
    marginBottom: 20,
    paddingHorizontal: 10,
},

inputAtivo: {
    borderWidth: 2,
    borderColor: '#1D3273',
},
    botao: {
        marginBottom: 10,
        backgroundColor: '#1D3273',
        alignSelf: 'center',
        justifyContent: 'center',
        width: 240,
        height: 40,
        borderRadius: 5,
    },
    btntexto: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15,
        alignSelf: 'center',
    },
    input_user: {
      width: 240,
      height: 40,
      alignSelf: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 5,
      borderWidth: 1,
      borderColor: '#D4D4D4',
      marginBottom: 20,
      paddingHorizontal: 10,
    },

input_email: {
  width: 240,
  height: 40,
  alignSelf: 'center',
  backgroundColor: '#FFFFFF',
  borderRadius: 5,
  borderWidth: 1,
  borderColor: '#D4D4D4',
  marginBottom: 20,
  paddingHorizontal: 10,
},

input_senha: {
  width: 240,
  height: 40,
  alignSelf: 'center',
  backgroundColor: '#FFFFFF',
  borderRadius: 5,
  borderWidth: 1,
  borderColor: '#D4D4D4',
  marginBottom: 20,
  paddingHorizontal: 10,
},

inputFocus: {
  borderColor: '#1D3273',
  borderWidth: 2,
},

    inputFocus: {
      borderColor: '#1D3273',
      borderWidth: 2,
    },

});