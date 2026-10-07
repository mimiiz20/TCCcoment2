import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Montserrat_400Regular } from '@expo-google-fonts/montserrat';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { router, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Usuarios() {

  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Montserrat_400Regular,
  });

  const [produtoAberto, setProdutoAberto] = useState(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState('');
  const [usuarios, setUsuarios] = useState([]);

  // Descobre em qual tela estamos
  const pathname = usePathname();

  // BUSCAR USUÁRIOS DO BANCO
  useEffect(() => {

    const buscarUsuarios = async () => {

      try {

        const resposta = await fetch(
          'http://10.154.20.25:5000/contas_app'
        );

        console.log('STATUS:', resposta.status);

        const dados = await resposta.json();

        console.log('USUÁRIOS:', dados);

        if (dados.success) {
          setUsuarios(dados.usuarios);
        }

      } catch (erro) {

        console.log('Erro ao buscar usuários:', erro);

      }

    };

    // Só busca quando estiver na tela CONTAS
    if (pathname === '/contas') {
      buscarUsuarios();
    }

  }, [pathname]);

  // EXCLUIR USUÁRIO
  const excluirUser = (id) => {
    Alert.alert(
      'Excluir usuário',
      'Tem certeza que deseja excluir este usuário?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const resposta = await fetch(
                `http://10.154.20.25:5000/excluirUsuario/${id}`,
                { method: 'DELETE' }
              );

              const data = await resposta.json();
              console.log('RESPOSTA EXCLUIR:', data);

              if (data.success) {
                Alert.alert('Sucesso', 'Item excluído com sucesso!');

                // Remove da tabela sem precisar recarregar
                setUsuarios((usuariosAtuais) =>
                  usuariosAtuais.filter((user) => user.id !== id)
                );
              } else {
                Alert.alert('Erro', data.erro || 'Erro ao excluir o usuário.');
              }
            } catch (erro) {
              console.log('ERRO AO EXCLUIR:', erro);
              Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
            }
          },
        },
      ]
    );
  };

  // CARREGAR USUÁRIO LOGADO
  useEffect(() => {

    const carregarUsuario = async () => {

      const nome = await AsyncStorage.getItem('nomeUsuario');
      const tipo = await AsyncStorage.getItem('tipoUsuario');

      setNomeUsuario(nome || '');
      setTipoUsuario(tipo || '');

    };

    carregarUsuario();

  }, []);


  if (!fontsLoaded) {
    return null;
  }


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


        <TouchableOpacity
          onPress={() => router.push('/tabela')}
        >

          <Text style={styles.link}>
            ESTOQUE
          </Text>

        </TouchableOpacity>


        <TouchableOpacity
          onPress={() => router.push('/editar')}
        >

          <Text style={styles.link}>
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


          <Text style={styles.sidebarTitulo}>
            USUÁRIO
          </Text>


          <Text style={styles.usuario}>
            {nomeUsuario}
          </Text>


          <Text style={styles.tipo}>
            {tipoUsuario === 'admin'
              ? 'Administrador'
              : 'Usuário'}
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

            <Text style={styles.logoutTexto}>
              DESLOGAR
            </Text>

          </TouchableOpacity>

        </View>

      )}


      {/* TÍTULO */}
      <Text style={styles.titulo}>
        Boas-Vindas ao Gerenciador de Contas!
      </Text>

      {/* TABELA */}
      <View style={styles.tabela}>

        {/* CABEÇALHO */}
        <View style={styles.linha}>
          <View style={styles.id}>
            <Text style={styles.cabecalho}>
              ID
            </Text>
          </View>

          <View style={styles.nome}>
            <Text style={styles.cabecalho}>
              NOME
            </Text>
          </View>

          <View style={styles.acao}>
            <Text style={styles.cabecalho}>
              AÇÃO
            </Text>
          </View>
        </View>

        {/* USUÁRIOS */}
        <FlatList
          data={usuarios}
          keyExtractor={(item) =>
            item.id.toString()
          }
          renderItem={({ item }) => (
            <>
              {/* LINHA DO USUÁRIO */}
              <View style={styles.linha}>
                <View style={styles.id}>
                  <Text style={styles.texto}>
                    {item.id}
                  </Text>
                </View>

                <View style={styles.nome}>
                  <Text style={styles.texto}>
                    {item.nome}
                  </Text>
                </View>

                <View style={styles.acao}>
                  <TouchableOpacity
                    style={styles.botao}
                    onPress={() =>
                      setProdutoAberto(
                        produtoAberto === item.id ? null : item.id
                      )
                    }
                  >
                    <MaterialIcons
                      name="visibility"
                      size={16}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.botaoExcluir}
                    onPress={() => excluirUser(item.id)}
                  >
                    <MaterialIcons
                      name="delete"
                      size={24}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* DETALHES */}
              {produtoAberto === item.id && (
                <View style={styles.detalhes}>
                  <Text style={styles.detalhe}>
                    <Text style={styles.negrito}>
                      E-MAIL:
                    </Text>
                    {' '}
                    {item.email}
                  </Text>

                  <Text style={styles.detalhe}>
                    <Text style={styles.negrito}>
                      TIPO:
                    </Text>
                    {' '}
                    {item.tipo === 'admin'
                      ? 'Administrador'
                      : 'Usuário'}
                  </Text>
                </View>
              )}
            </>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F0F1F2',
  },

  titulo: {
    fontSize: 25,
    textAlign: 'center',
    color: '#1D3273',
    marginBottom: 25,
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

  menuButton: {
    marginRight: 10,
  },

  link: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 22,
    fontFamily: 'Poppins_700Bold',
  },

  tabela: {
    marginHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F28705',
    borderRadius: 8,
    overflow: 'hidden',
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

  linha: {
    flexDirection: 'row',
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#F28705',
  },

  id: {
    width: '15%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F28705',
  },

  nome: {
    width: '65%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F28705',
  },

acao: {
    width: '20%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  cabecalho: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#333333',
    textAlign: 'center',
  },

  texto: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },

  botao: {
    width: 26,
    height: 26,
    backgroundColor: '#1D3273',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoExcluir: {
    width: 26,
    height: 26,
    backgroundColor: '#1D3273',
    borderRadius: 5,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },

  detalhes: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F28705',
  },

  detalhe: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 4,
  },

  negrito: {
    fontWeight: 'bold',
  },
});