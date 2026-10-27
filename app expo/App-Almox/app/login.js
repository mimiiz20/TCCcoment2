import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity } from 'react-native';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Poppins_700Bold } from '@expo-google-fonts/poppins';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react'; // Serve pra criar uma informação que pode mudar durante o funcionamento da tela
import { router } from 'expo-router'; // Serve para fazer a navegação das telas
import AsyncStorage from '@react-native-async-storage/async-storage'; //Guarda as informações de login localmente


export default function Login() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
    Montserrat_400Regular,
    Montserrat_700Bold,
    Poppins_700Bold,
  });

  // Aqui é guardado o valor de email e senha, e antes do usuário digitar o valor inicial é vazio
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Aqui é guardado o valor verdadeiro ou falso, que quando o usuário clica na caixa de input é ativado TRUE (que depois é usado pra mudar a cor das bordas pra azul)
  const [emailFocus, setEmailFocus] = useState(false); // O campo não foi selecionado, fica emailFocus, se for ele vira setEmailFocus
  const [senhaFocus, setSenhaFocus] = useState(false);

  // Só retorna depois de executar todos os Hooks
  if (!fontsLoaded) {
    return null;
  }

  // Criamos uma função de fazerLogin, pra depois poder ser utilizada no botão de entrar na página
  const fazerLogin = async () => { // A função trabalha com operações assíncronas (que trabalham juntas ao Flask e esperam um e outro se conversarem)
  try { // Significa que ele ira tentar fazer a conexão com o Flask (se der certo, o código continua e se der erro ele vai lá pro catch)
    const resposta = await fetch('http://10.154.20.212:5000/login_app', { // Fetch faz uma requisição ao servidor Flask, recebendo a rota de login específica para o app
      method: 'POST', // As informações de email e senha estão sendo enviados pelo método POST
      headers: {
        'Content-Type': 'application/json', // Isso informa ao servidor que os dados enviados  tem que ser em formato JSON
      },
      body: JSON.stringify({ // O JavaScript tem um objeto e precisa ser transformado em JSON para enviar a requisição
        email: email,
        senha: senha,
      }),
    });

    const dados = await resposta.json(); // Aqui transformamos novamente o JSON em objetvo para ser requisitado depois no código (dados.tipo, dados.usuario)

    console.log('STATUS:', resposta.status); // Mostra no terminal qual o status da requisição do usuário
    console.log('RESPOSTA DO SERVIDOR:', dados); // Mostra a resposta do servidor 

    if (!resposta.ok) { // Se a requisição não der certo 
      alert(dados.mensagem || 'Email ou senha incorretos'); // Ai uma mensagem de alerta será enviada 
      return; // Para a função da mensagem
    }

    await AsyncStorage.setItem('tipoUsuario', dados.tipo); // Salva o tipo de usuário
    await AsyncStorage.setItem('nomeUsuario', dados.usuario); // Aqui salvamos o nome do usuário, informado no banco e no cadastro de usuários
    await AsyncStorage.setItem('emailUsuario', dados.email); // Salva o email do usuário

    router.replace('/tabela'); // Se estiver tudo certo, ele direciona/substitui o usuário para tela de tabela.js

  } catch (erro) { // Captura possíveis erros que podem ocorrer durante a tentativa de login
    console.log(erro); // Exibe o erro no console para ajudar a identificar o problema
    alert('Não foi possível conectar ao servidor'); // Exibe essa mensagem no celular do usuário via JSON 
  }
};

  return (
    <View style={styles.container}> 
      <Image
        source={require('../assets/industria.png')}
        style={styles.background}
        resizeMode="cover" // Faz a imagem preencher a área disponível, podendo cortar partes dela
      />

      <LinearGradient
        colors={[
          'rgba(29, 50, 115, 0.25)', 
          'rgba(82, 104, 168, 0.95)'
        ]}
        start={{ x: 0, y: 0 }} // Define o início do gradiente no topo (0 é transparente e 1 é opaco)
        end={{ x: 0, y: 1 }} // Define o final do gradiente
        style={styles.gradient}
      />

      <View style={styles.content}>
        <Text style={styles.paragraph1}>
          BOAS-VINDAS
        </Text>

        <Text style={styles.paragraph2}>
          AO SENAI ALMOXARIFADO
        </Text>

        <View style={styles.inputContainer}> // Agrupa todos os elementos do quadro branco
          <Image
            source={require('../assets/fiep.png')}
            style={styles.logo}
          />

          <Text style={styles.email}>
            Email
          </Text>

          <TextInput
            style={[
              styles.input, // Define estilo padrão antes do usuário clicar no campo input
              emailFocus && styles.inputFocus // emailFocus agora é true, então o estilo inputFocus é ativado
            ]}
            placeholder="seunome@empresa.com" // Sugestão dentro da caixa input
            placeholderTextColor="#888" // Cor do textinho
            value={email} // Vincula o conteúdo digitado a variável email
            onChangeText={setEmail} // Atualiza a variável conforme o usuário vai digitando
            onFocus={() => setEmailFocus(true)} // Ativa o estado de foco quando o usuário seleciona o campo (true)
            onBlur={() => setEmailFocus(false)} // Desativa o estado de foco quando o usuário sai do campo (false)
          />

          <Text style={styles.senha}>
            Senha
          </Text>

          <TextInput
            style={[
              styles.input,
              senhaFocus && styles.inputFocus // senhaFocus agora é true, então o estilo senhaFocus é ativado
            ]}
            placeholder="Digite sua senha" // Sugestão dentro da caixa input
            placeholderTextColor="#888" // Cor do textinho
            value={senha} // Vincula o conteúdo digitado a variável senha
            onChangeText={setSenha} // Atualiza a variável conforme o usuário vai digitando
            onFocus={() => setSenhaFocus(true)} // Ativa o estado de foco quando o usuário seleciona o campo (true)
            onBlur={() => setSenhaFocus(false)} // Desativa o estado de foco quando o usuário sai do campo (false)
          />

          <TouchableOpacity
            style={styles.button}
            onPress={fazerLogin} // Quando o usuário clicar, o botão terá outro estilo
          >
            <Text style={styles.buttonText}>
              ENTRAR
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },

  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 60,
  },

  paragraph1: {
    width: '90%',
    fontSize: 23,
    fontFamily: 'Montserrat_400Regular',
    color: '#F0F1F2',
    textAlign: 'left',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },

  paragraph2: {
    width: '90%',
    fontSize: 25,
    fontFamily: 'Montserrat_700Bold',
    color: '#F0F1F2',
    textAlign: 'left',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },

  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: '90%',
    maxWidth: 350,
    minHeight: 435,
    marginTop: 50,
    paddingVertical: 20,
    paddingHorizontal: 10,
  },

  logo: {
    width: '100%',
    height: 110,
    resizeMode: 'contain',
    marginBottom: 20,
    alignSelf: 'center',
  },

  email: {
    color: '#1f1f1f',
    width: '90%',
    fontSize: 20,
    lineHeight: 25,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 8,
    alignSelf: 'center',
  },

  senha: {
    color: '#1f1f1f',
    width: '90%',
    fontSize: 20,
    lineHeight: 25,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 8,
    alignSelf: 'center',
  },

  input: {
    width: '90%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    paddingHorizontal: 15,
    marginBottom: 15,
    alignSelf: 'center',
    outlineStyle: 'none',
  },

  inputFocus: {
    borderColor: '#1D3273',
    borderWidth: 2,
  },

  button: {
    width: '90%',
    height: 50,
    backgroundColor: '#1D3273',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
  },

  buttonText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});