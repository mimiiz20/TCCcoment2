import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Modal, Alert} from 'react-native';
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';

export default function Tabela() {

  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Montserrat_400Regular,
  });

  const [produtoAberto, setProdutoAberto] = useState(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [imagemAberta, setImagemAberta] = useState(null);
  const [produtos, setProdutos] = useState([]);
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

  useFocusEffect(
  useCallback(() => {
    const buscarProdutos = async () => {
      try {
        const resposta = await fetch('http://10.154.20.25:5000/tabela_app');
        const dados = await resposta.json();

        if (dados.success) {
          const produtosFormatados = dados.produtos.map((item) => ({
            id: item.id,
            responsavel: item.responsavel,
            nome: item.nome,
            categoria: item.categoria,
            quantidade: item.qtde,
            estoque_min: item.estoque_min,
            preco: item.preco,
            descricao: item.descricao,
            imagem: item.imagem,
          }));

          setProdutos(produtosFormatados);
        }
      } catch (erro) {
        console.log('ERRO AO BUSCAR PRODUTOS:', erro);
      }
    };

    buscarProdutos();
  }, [])
);

// EXCLUIR ITEM
const excluirItem = (id) => {
  Alert.alert(
    'Excluir item',
    'Tem certeza que deseja excluir este item?',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            const resposta = await fetch(
              `http://10.154.20.25:5000/excluir/${id}`,
              { method: 'DELETE' }
            );

            const data = await resposta.json();
            console.log('RESPOSTA EXCLUIR:', data);

            if (data.success) {
              Alert.alert('Sucesso', 'Item excluído com sucesso!');

              // Remove da tabela sem precisar recarregar
              setProdutos((produtosAtuais) =>
                produtosAtuais.filter((item) => item.id !== id)
              );
            } else {
              Alert.alert('Erro', data.erro || 'Erro ao excluir o item.');
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

  return (
    <View style={styles.background}>

<Modal
  visible={imagemAberta !== null}
  transparent={true}
  animationType="fade"
  onRequestClose={() => setImagemAberta(null)}
>
  <View style={styles.fundoPopup}>
    <View style={styles.popup}>

      <TouchableOpacity
        style={styles.fecharPopup}
        onPress={() => setImagemAberta(null)}
      >
        <MaterialIcons
          name="close"
          size={25}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      {imagemAberta && (
        <Image
          source={{
            uri: `http://10.154.20.25:5000/${imagemAberta}`
          }}
          style={styles.imagemPopup}
          resizeMode="contain"
        />
      )}

    </View>
  </View>
</Modal>

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
          <Text style={styles.link}>ESTOQUE</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/editar')}>
          <Text style={styles.link}>EDITAR</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/contas')}>
          <Text style={styles.link}>CONTAS</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/cadastro')}>
          <Text style={styles.link}>CADASTRO</Text>
        </TouchableOpacity>
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

      <Text style={styles.titulo}>
        {"Boas-vindas ao\nAlmoxarifado!"}
      </Text>

      <View style={styles.tabela}>

        {/* CABEÇALHO */}
        <View style={styles.linha}>
          <View style={styles.id}>
            <Text style={styles.cabecalho}>ID</Text>
          </View>
          <View style={styles.nome}>
            <Text style={styles.cabecalho}>NOME</Text>
          </View>
          <View style={styles.responsavel}>
            <Text style={styles.cabecalho}>RESPONSÁVEL</Text>
          </View>
          <View style={styles.acao}>
            <Text style={styles.cabecalho}>AÇÃO</Text>
          </View>
        </View>

        {/* PRODUTOS */}
        <FlatList
          data={produtos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <>
              <View style={styles.linha}>
                <View style={styles.id}>
                  <Text style={styles.texto}>{item.id}</Text>
                </View>

                <View style={styles.nome}>
                  <Text style={styles.texto}>{item.nome}</Text>
                </View>

                <View style={styles.responsavel}>
                  <Text style={styles.texto}>{item.responsavel}</Text>
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
                      onPress={() => excluirItem(item.id)}
                    >
                      <MaterialIcons
                        name="delete"
                        size={24}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                </View>
              </View>

              {/* DETALHES A MAIS */}
              {produtoAberto === item.id && (
                <View style={styles.detalhes}>
                  <Text style={styles.detalhe}>
                    <Text style={styles.negrito}>CATEGORIA:</Text> {item.categoria}
                  </Text>

                  <Text style={styles.detalhe}>
                    <Text style={styles.negrito}>QUANTIDADE:</Text> {item.quantidade}
                  </Text>

                  <Text style={styles.detalhe}>
                    <Text style={styles.negrito}>QUANT MÍN:</Text> {item.estoque_min}
                  </Text>

                  <Text style={styles.detalhe}>
                    <Text style={styles.negrito}>PREÇO:</Text> {item.preco}
                  </Text>

                  <Text style={styles.detalhe}>
                    <Text style={styles.negrito}>DESCRIÇÃO:</Text> {item.descricao}
                  </Text>

                  <TouchableOpacity
                    style={styles.botaoImagem}
                    onPress={() => setImagemAberta(item.imagem)}
                  >
                    <MaterialIcons
                      name="image"
                      size={18}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
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
  link: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 25,
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
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F28705',
  },
  responsavel: {
    width: '35%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F28705',
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
  acao: {
    width: '20%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  botaoImagem: {
    width: 40,
    height: 40,
    backgroundColor: '#1D3273',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 10,
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
  fundoPopup: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    width: '80%',
    height: '60%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fecharPopup: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: '#1D3273',
    borderRadius: 15,
    padding: 5,
  },
  imagemPopup: {
    width: '100%',
    height: '80%',
  },
});