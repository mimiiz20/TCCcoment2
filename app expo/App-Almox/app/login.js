import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity } from 'react-native';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Poppins_700Bold } from '@expo-google-fonts/poppins';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react'; // Serve pra criar uma informação que pode mudar durante o funcionamento da tela
import { router } from 'expo-router'; // Serve para fazer a navegação das telas
import AsyncStorage from '@react-native-async-storage/async-storage'; //Guarda as informações de login localmente

export default function Login() { // A nossa tela é uma função que será construída como um componente

  const [fontsLoaded] = useFonts({ // Retorna uma informação se as fontes que foram importadas já foram carregadas
    Inter_400Regular,
    Inter_700Bold,
    Montserrat_400Regular,
    Montserrat_700Bold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) { // Aqui serve se as fontes não forem carregadas não é pra mostrar a tela ainda
    return null;
  }

  // Aqui é guardado o valor de email e senha, e antes do usuário digitar o valor inicial é vazio
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Aqui é guardado o valor verdadeiro ou falso, que quando o usuário clica na caixa de input é ativado TRUE (que depois é usado pra mudar a cor das bordas pra azul)
  const [emailFocus, setEmailFocus] = useState(false);
  const [senhaFocus, setSenhaFocus] = useState(false);

  // Criamos uma função de fazerLogin, pra depois poder ser utilizada no botão de entrar na página
  const fazerLogin = async () => { // A função trabalha com operações assíncronas (que trabalham juntas ao Flask e esperam um e outro se conversarem)
  try { // Significa que ele ira tentar fazer a conexão com o Flask (se der certo, o código continua e se der erro ele vai lá pro catch)
    const resposta = await fetch('http://10.154.20.25:5000/login_app', { // Fetch faz uma requisição ao servidor Flask, recebendo a rota de login específica para o app
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

    router.replace('/tabela');

  } catch (erro) {
    console.log(erro);
    alert('Não foi possível conectar ao servidor');
  }
};

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/industria.png')}
        style={styles.background}
        resizeMode="cover"
      />

      <LinearGradient
        colors={[
          'rgba(29, 50, 115, 0.25)',
          'rgba(82, 104, 168, 0.95)'
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      />

      <View style={styles.content}>
        <Text style={styles.paragraph1}>
          BOAS-VINDAS
        </Text>

        <Text style={styles.paragraph2}>
          AO SENAI ALMOXARIFADO
        </Text>

        <View style={styles.inputContainer}>
          <Image
            source={require('../assets/fiep.png')}
            style={styles.logo}
          />

          <Text style={styles.email}>
            Email
          </Text>

          <TextInput
            style={[
              styles.input,
              emailFocus && styles.inputFocus
            ]}
            placeholder="seunome@empresa.com"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocus(true)}
            onBlur={() => setEmailFocus(false)}
          />

          <Text style={styles.senha}>
            Senha
          </Text>

          <TextInput
            style={[
              styles.input,
              senhaFocus && styles.inputFocus
            ]}
            placeholder="Digite sua senha"
            placeholderTextColor="#888"
            value={senha}
            onChangeText={setSenha}
            onFocus={() => setSenhaFocus(true)}
            onBlur={() => setSenhaFocus(false)}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={fazerLogin}
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