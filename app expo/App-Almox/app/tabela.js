// FlatList: serve exibir listas de elementos de forma eficiente renderizando os itens necessários 
// Modal: exibe uma janela sobre o conteúdo principal sem precisar abrir outra tela
// Alert: Exibe as mensagens de erro de caixas de diálogo 
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Modal, Alert} from 'react-native'; 
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import {Inter_400Regular, Inter_700Bold} from '@expo-google-fonts/inter';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useCallback } from 'react'; // useCallback: serve para preservar a mesma referência de uma função entre renderizações (evitandoe erros)
import AsyncStorage from '@react-native-async-storage/async-storage'; // É utilizado para armazenar pequenos dados localmente, permitindo que fiquem disponíveis mesmo após o fechamento do app
import { router, useFocusEffect } from 'expo-router';

export default function Tabela() {

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
    Montserrat_400Regular,
    Montserrat_700Bold,
    Poppins_700Bold,
  });

  // Essa parte tem a mesma funcionalidade para todos os consts. Por exemplo, produtoAberto guarda o input selecionado, setProduto altera o produto mudando o estilo
  // e depois o useState serve para definir o valor inicial que começa vazio
  const [produtoAberto, setProdutoAberto] = useState(null);
  const [menuAberto, setMenuAberto] = useState(false); // O menu começa fechado, por isso o false, já que precisam selecionar ele 
  const [imagemAberta, setImagemAberta] = useState(null); // Valor vazio atém o modal da imagem for adicionada e aberta
  const [produtos, setProdutos] = useState([]); // Inicia um estado com um array vazio, que quando a lista de produtos for enviada, ele atualiza
  const [nomeUsuario, setNomeUsuario] = useState(''); // Define uma string vazia como valor inicial
  const [tipoUsuario, setTipoUsuario] = useState('');

  useFocusEffect( // Executa um efeito de foco, quando o usuário entra ou retorna na tela
    useCallback(() => { // Memoriza a função enquanto suas dependências não mudaram
      const carregarUsuario = async () => { // Define a função assincrona
        const nome = await AsyncStorage.getItem('nomeUsuario'); // Ele vai consultar o nome do usuário e o tipo dele, serve pra ser utilizado para mostrar na sidebar
        const tipo = await AsyncStorage.getItem('tipoUsuario');

        // O opereador || significa que ele vai pegar o valor a esquerda, e se nao for verdadeiro ele vai receber uma string vazia
        setNomeUsuario(nome || '');
        setTipoUsuario(tipo || '');
      };

      carregarUsuario(); // Execução da função
    }, [])
  );

  useFocusEffect(
  useCallback(() => {
    const buscarProdutos = async () => { // Declara a função que vai buscar os produtos
      try { // Try: função de tratamento de possíveis erros durante a busca do Flask
        const resposta = await fetch('http://10.154.20.212:5000/tabela_app'); // Fetch: realiza uma requisição HTTP para acessar o endereço da maquina e a rota criada no app.py
        const dados = await resposta.json(); // Interpreta os dados enviados em JSON, aguarda a conversão e armazena em "dados"

        if (dados.success) { // Se os dados retornarem "sucess" na API 
          const produtosFormatados = dados.produtos.map((item) => ({ // O código percorre todos os produtos recebidos e cria uma nova lista com os campos necessários
            id: item.id, // O primeiro nome é o que o app usa, o segundo é o que vem da API (Flask)
            responsavel: item.responsavel,
            nome: item.nome,
            categoria: item.categoria,
            quantidade: item.qtde,
            estoque_min: item.estoque_min,
            preco: item.preco,
            descricao: item.descricao,
            imagem: item.imagem,
          }));

          // setProdutos: Usado para atualizar o estado "produtos"
          // produtosFormatados: É a lista de produtos que acabou de ser organizada 
          setProdutos(produtosFormatados); 
        }
        // Aqui ele retorna uma mensagem de console de erro, caso a condição não de certo
      } catch (erro) {
        console.log('ERRO AO BUSCAR PRODUTOS:', erro);
      }
    };

    buscarProdutos(); // Só aqui a função é executada
  }, []) // O [] serve para fechar um useEffect com um array de dependências vazio
         // Esse efeito é útil para buscar os produtos quando a tabela é aberta, sem repetir a busca a cada nova renderização de produto
);

// EXCLUIR ITEM
const excluirItem = (id) => { // Quando um usuário pede e a exclusão de um produto, a função recebe o id do produto 
  Alert.alert( // Abre uma caixa de diálogo na tela do app, pelo Alert do React Native
    'Excluir item',
    'Tem certeza que deseja excluir este item?',
    [
      { text: 'Cancelar', style: 'cancel' }, // O primeiro define o texto e o segundo o cancelamento da ação
      {
        text: 'Excluir', // A mesma coisa para a função excluir
        style: 'destructive',
        onPress: async () => { // A exclusão só começa quando o usuário toca em excluir (ação assincrona)
          try { // Um bloco que tentará executar as operações
            const resposta = await fetch( // Cria a variável resposta e aguarda a conclusão da solicitação
              `http://10.154.20.212:5000/excluir/${id}`, // Endereço do endpoint responsável por excluir o produto. ${id} serve para inserir o identificador recebido pela função diretamente na URL
              { method: 'DELETE' } // Define o método HTTP DELETE
            );
            // Basicamente essa parte serve para enviar uma solicitação ao servidor Flask, que vai identificar o produto pelo ID e
            // executar a exclusão no banco de dados conforme a rota na API do Flask. O React Native não excluir diretamente, mas faz uma solicitação ao servidor

            const data = await resposta.json(); // Cria variável para armazenar dados da resposta, e interpreta a resposta HTTP em JSON
            console.log('RESPOSTA EXCLUIR:', data);  // É a mensagem que identifica o conteúdo registrado no console

            if (data.success) { // Se a exclusão foi bem sucedida 
              Alert.alert('Sucesso', 'Item excluído com sucesso!'); // Ele vai retornar uma mensagem de console no app

              // Remove da tabela sem precisar recarregar
              setProdutos((produtosAtuais) => // Atualiza o estado "produtos" do React que armazena a lista de produtos utilizada na interface
                // O método filter() percorre a lista inteira e cria um novo array contendo somente os elementos que atendem a condição definida
                // item: Representa cada produto da lista | item.id: É o ID do produto analisado
                // !==: Significa "diferente de", comparando outros tipos de valores
                // id: É o identificador do produto excluido
                produtosAtuais.filter((item) => item.id !== id) // Função que recebe a lista atual dos produtos (ele faz com o estado mais recente, pra atualização ser feita corretamente)
              );
            } else {
              Alert.alert('Erro', data.erro || 'Erro ao excluir o item.'); // Se o servidor informar que não conseguiu excluir o produto, o app mostra um erro alert
            }
          } catch (erro) {
            console.log('ERRO AO EXCLUIR:', erro); // Essa e a mensagem que aparece no console do Vs Code
            Alert.alert('Erro', 'Não foi possível conectar ao servidor.'); // Já esse erro informa que não foi possível se conectar ao servidor
          }
        },
      },
    ]
  );
};

  return (
    <View style={styles.background}>

<Modal
  visible={imagemAberta !== null} // Define se o modal esta visível, e ele apareccfe quando é diferente de null
  transparent={true} // Permite que o fundo do modal seja transparente (efeito de sobreposição)
  animationType="fade" // Faz o modal aparecer e desaparecer com uma animação "fade"
  onRequestClose={() => setImagemAberta(null)} // Define o que acontece quando o usuário fecha o modal
>
  <View style={styles.fundoPopup}>
    <View style={styles.popup}>

      <TouchableOpacity
        style={styles.fecharPopup}
        onPress={() => setImagemAberta(null)} // Define o que acontece quando o modal é aberto
      >
        <MaterialIcons
          name="close"
          size={25}
          color="#FFFFFF"
        />
      </TouchableOpacity>

       
      {imagemAberta && ( 
        // {}: Permite inserir uma expressão JavaScript dentro do JSX (JavaScript XML: uma extensão de sintaxe do JavaScript utilizada no React e React Native para escrever interfaces de forma parecida com HTML)
        // imagemAberta: Contém o caminho da imagem selecionada
        // &&: Operador lógico "E", que é quando o conteúdo a direita é renderizado quando a expressão a esquerda é verdadeira
        <Image // Esse é o componente do React Native que é utilizado para carregar imagens
          source={{ // Source: Informa da onde a imagem será carregada 
            uri: `http://10.154.20.212:5000${imagemAberta}` // Uri: Especifica o endereço da imagem, combinando o endereço do servidor com o caminho armazenado no estado, solicitando a imgem ao servidor Flask
          }}
          style={styles.imagemPopup}
          resizeMode="contain" // Define como a imagem irá aparecer ao ser inserida. Nesse caso, "contain" serve pra manter a proporção original da imagem e tenta exibir ela inteira, dentro da área definida
        />
      )}

    </View>
  </View>
</Modal>

      {/* NAVBAR: Ele é um comentário JSX que serve pra identificar essa parte do código */} 
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuAberto(!menuAberto)} // Define a ção que será executada quando o botão for pressionado, e depoois atualiza o estado que controla se o menu esta aberto ( o operador ! inverte o valor booleano)
        >
          <MaterialIcons
            name="menu"
            size={30}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* Utiliza a função que criamos para fazer um operador de condição. Se for admin, ele vai usar o estilo "link" caso contrario : for um usuário comum ele vai usar "linkUsuario" */}
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

        {/* Se o tipo de usuário for um admin, ele vai ter acesso a mais 2 links de acesso*/}
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
      {/* Quando menuAberto for true a sidebar aparece, mas se for false ela não é renderizada*/}
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

          {/* Define a aparência do titulo, depois insere o valor da variável nomeUsuário na interface; dai identifica se o tipo é de admin (true) e se for usuario (false)*/}
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
        {/* Aqui ele identifica os titulos das colunas*/}
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
        {/* Componente do React Native utilizado para exibir lista de dados dos produtos*/}
          data={produtos}
          {/* Define a chave única pra identificar cada elemento da lista; (item) representa qual é o produto; converte o id em string*/}
          {/* Define como cada item da lista deve ser apresentado na interfacfe; onde para cada produto da lista o React Native executa essa função e monta uma linha correspondente a posição dos itens*/}
          keyExtractor={(item) => item.id.toString()}
        <FlatList 
          renderItem={({ item }) => (
            <>
              {/* Define o estilo de todas as linhas da tabela; depois define o espaõ destinado a coluna e mostra cada item*/}
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
                  {/* Determina o que acontece quando o usuário clica no botão; para fechar você clica novamente e o estado passa a ser "null"*/}
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
              {/* Se o ID do produto selecionado é igual ao valor armazenado em produtoAberto*/}
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

                  {/* O código anterior do modal da imagem é usado aqui de novo, atualizando o estado da imagemAberta*/}
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

  linkUsuario: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 80,
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