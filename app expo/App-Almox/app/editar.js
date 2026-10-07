import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity, FlatList, Modal, Alert, ScrollView} from 'react-native';
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File } from 'expo-file-system';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function Editar() {

  const [fontsLoaded] = useFonts({
      Poppins_700Bold,
      Montserrat_400Regular,
      Montserrat_700Bold
  });

  const [menuAberto, setMenuAberto] = useState(false);

  // Tipo da operação
  const [tipo, setTipo] = useState('entrada');

  // Campos do produto
  const [nome, setNome] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState(''); 
  const [preco, setPreco] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [estoqueMin, setEstoqueMin] = useState('');
  const [imagem, setImagem] = useState(null);

  // Controla o tipo do usuário
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

  // Controle de envio
  const [carregando, setCarregando] = useState(false);

  // Permissão para acessar galeria de imagem
  const escolherImagem = async () => {
  const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissao.granted) {
    Alert.alert(
      'Permissão necessária',
      'Permita o acesso às fotos para escolher uma imagem.'
    );
    return;
  }

  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
  });

  if (!resultado.canceled) {
    setImagem(resultado.assets[0]);
  }
};

  // CONFIRMAR OPERAÇÃO

  const confirmarOperacao = async () => {

    if (!nome || !quantidade || !responsavel) {
      Alert.alert(
        'Atenção',
        'Preencha o nome, a quantidade e o responsável'
      );
      return;
    }

    const quantidadeNumero = parseInt(quantidade);

    if (isNaN(quantidadeNumero) || quantidadeNumero <= 0) {
      Alert.alert(
        'Atenção',
        'Digite uma quantidade válida'
      );
      return;
    }

     const precoNumero = preco ? parseFloat(preco.replace(',', '.')) : 0;

    if (isNaN(precoNumero) || precoNumero < 0) {
      Alert.alert(
        'Atenção',
         'Digite um preço válido'
        );
      return;
    }

      setCarregando(true);

      try {

        const formulario = new FormData();

        formulario.append('nome', nome);
        formulario.append('categoria', categoria);
        formulario.append('qtde', quantidade);
        formulario.append('responsavel', responsavel);
        formulario.append('estoque_min', estoqueMin || '0');
        formulario.append('preco', String(precoNumero));
        formulario.append('descricao', descricao);
        formulario.append('tipo', tipo);

        if (imagem?.uri) {
          const arquivo = new File(imagem.uri);

          formulario.append('imagem', arquivo);
        }

        const resposta = await fetch(
          'http://10.154.20.25:5000/entrada_app',
          {
            method: 'POST',
            body: formulario,
          }
        );

        const dados = await resposta.json();

        console.log('STATUS:', resposta.status);
        console.log('RESPOSTA:', dados);

        if (!resposta.ok) {
          Alert.alert(
            'Erro',
            dados.erro || 'Não foi possível realizar a operação'
          );
          return;
        }

        Alert.alert(
          'Sucesso',
          tipo === 'entrada'
            ? 'Entrada realizada com sucesso!'
            : 'Saída realizada com sucesso!'
        );

        // Limpa os campos
        setNome('');
        setResponsavel('');
        setDescricao('');
        setCategoria('');
        setPreco('');
        setQuantidade('');
        setEstoqueMin('');
        setImagem(null);

        // Vai para a tabela
        router.replace('/tabela');

      } catch (erro) {

        console.log('ERRO:', erro);

        Alert.alert(
          'Erro',
          'Não foi possível conectar ao servidor'
        );

      } finally {

        setCarregando(false);

      }
};

  return (
    <View style={styles.container}>

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

            <Text style={styles.logoutTexto}>
              DESLOGAR
            </Text>

          </TouchableOpacity>

        </View>

      )}

      {/* CONTEÚDO */}

      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
      >

        {/* TÍTULO */}

        <Text style={styles.titulo}>
          {'Boas-vindas ao\nEditar almoxarifado!'}
        </Text>

        {/* ENTRADA / SAÍDA */}

        <View style={styles.botoesTipo}>
          <TouchableOpacity
            style={[
              styles.botaoTipo,
              tipo === 'entrada' && styles.botaoSelecionado
            ]}
            onPress={() => setTipo('entrada')}
          >

            <Text style={styles.textoBotao}>
              ENTRADA
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.botaoTipo,
              tipo === 'saida' && styles.botaoSelecionado
            ]}
            onPress={() => setTipo('saida')}
          >

            <Text style={styles.textoBotao}>
              SAÍDA
            </Text>

          </TouchableOpacity>

        </View>

        {/* CARD */}
        <View style={styles.card}>

          <Text style={styles.produtosTitulo}>
            {tipo === 'entrada'
              ? 'ENTRADA DE PRODUTO'
              : 'SAÍDA DE PRODUTO'}
          </Text>

          {/* NOME */}
          <Text style={styles.label}>
            NOME
          </Text>

          <TextInput
            style={styles.campo}
            placeholder="Digite o nome"
            placeholderTextColor="#8A8A8A"
            value={nome}
            onChangeText={setNome}
          />

          {/* RESPONSÁVEL */}
          <Text style={styles.label}>
            RESPONSÁVEL
          </Text>

          <TextInput
            style={styles.campo}
            placeholder="Digite o responsável"
            placeholderTextColor="#8A8A8A"
            value={responsavel}
            onChangeText={setResponsavel}
          />

          {/* CATEGORIA */}
          <Text style={styles.label}>
            CATEGORIA
          </Text>

          <TextInput
            style={styles.campo}
            placeholder="Digite a categoria"
            placeholderTextColor="#8A8A8A"
            value={categoria}
            onChangeText={setCategoria}
          />

            {/* PREÇO */}
            <Text style={styles.label}>
              PREÇO
            </Text>

            <TextInput
              style={styles.campo}
              placeholder="Digite o preço"
              placeholderTextColor="#8A8A8A"
              value={preco}
              onChangeText={setPreco}
              keyboardType="decimal-pad"
            />
                
          {/* QUANTIDADE */}
          <Text style={styles.label}>
            QUANTIDADE
          </Text>

          <TextInput
            style={styles.campo}
            placeholder="Digite a quantidade"
            placeholderTextColor="#8A8A8A"
            value={quantidade}
            onChangeText={setQuantidade}
            keyboardType="numeric"
          />

          {/* ESTOQUE MÍNIMO */}
          <Text style={styles.label}>
            ESTOQUE MÍNIMO
          </Text>

          <TextInput
            style={styles.campo}
            placeholder="Digite o estoque mínimo"
            placeholderTextColor="#8A8A8A"
            value={estoqueMin}
            onChangeText={setEstoqueMin}
            keyboardType="numeric"
          />

          {/* DESCRIÇÃO */}
          <Text style={styles.label}>
            DESCRIÇÃO
          </Text>

          <TextInput
            style={[
              styles.campo,
              styles.campoDescricao
            ]}
            placeholder="Descrição do produto"
            placeholderTextColor="#8A8A8A"
            value={descricao}
            onChangeText={setDescricao}
            multiline
          />

          {/* IMAGEM */}
          <Text style={styles.label}>
            IMAGEM
          </Text>

          <TouchableOpacity
            style={styles.botaoImagem}
            onPress={escolherImagem}
          >
            <MaterialIcons
              name="image"
              size={22}
              color="#FFFFFF"
            />

            <Text style={styles.textoImagem}>
              {imagem ? 'ALTERAR IMAGEM' : 'ADICIONAR IMAGEM'}
            </Text>
          </TouchableOpacity>

          {imagem && (
            <Image
              source={{ uri: imagem.uri }}
              style={styles.previewImagem}
              resizeMode="cover"
            />
          )}

          {/* CONFIRMAR */}
          <TouchableOpacity
            style={[
              styles.botaoConfirmar,
              carregando && styles.botaoDesabilitado
            ]}
            onPress={confirmarOperacao}
            disabled={carregando}
          >

            <Text style={styles.textoConfirmar}>
              {carregando
                ? 'ENVIANDO...'
                : 'CONFIRMAR'}
            </Text>

          </TouchableOpacity>

        </View>

      </ScrollView>

    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F1F2',
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

  closeButton: {
    position: 'absolute',
    right: 10,
    top: 2,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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

  tipoUsuario: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    marginBottom: 30,
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
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },

  logoutTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },

  conteudo: {
    paddingBottom: 40,
  },

  titulo: {
    fontSize: 25,
    textAlign: 'center',
    color: '#1D3273',
    marginBottom: 25,
    fontFamily: 'Poppins_700Bold',
  },

  botoesTipo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },

  botaoTipo: {
    minWidth: 110,
    height: 42,
    borderRadius: 5,
    borderColor: '#1D3273',
    borderWidth: 2,
    backgroundColor: '#51608C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
  },

  botaoSelecionado: {
    backgroundColor: '#1D3273',
    borderColor: '#F28705',
  },

  textoBotao: {
    fontSize: 15,
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 22,
    borderWidth: 2,
    borderColor: '#F28705',
  },

  produtosTitulo: {
    color: '#1D3273',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },

  label: {
    color: '#1D3273',
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },

  campo: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#4A64A3',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    color: '#333333',
  },

  campoDescricao: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },

  botaoImagem: {
    height: 45,
    backgroundColor: '#1D3273',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 5,
  },

  textoImagem: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  previewImagem: {
    width: '100%',
    height: 180,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4A64A3',
  },

  botaoConfirmar: {
    height: 45,
    backgroundColor: '#1D3273',
    borderRadius: 6,
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  botaoDesabilitado: {
    opacity: 0.6,
  },

  textoConfirmar: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },

});

