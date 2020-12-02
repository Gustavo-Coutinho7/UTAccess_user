import React, {Component} from 'react';
import {
  Text,
  StyleSheet,
  View,
  SafeAreaView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  PermissionsAndroid,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import {IMAGE} from '../constants/Image';
import {ApiUrl} from '../constants/ApiUrl';

export class LoginScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
    };
  }

  signIn = async () => {
    try {
      let response = await fetch(ApiUrl + 'auth', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 3000,
        body: JSON.stringify({
          email: this.state.email,
          password: this.state.password,
        }),
      });

      let responseJson = await response.json();
      if (responseJson.auth === 'OK') {
        try {
          AsyncStorage.multiSet([
            ['name', responseJson.user.name],
            ['id', responseJson.user.id.toString()],
            ['token', responseJson.user.token],
            ['email', responseJson.user.email],
          ]);
          this.setState({email: '', password: ''});
          this.props.navigation.navigate('HomeApp');
        } catch (error) {
          console.log(error);
        }
      } else {
        Alert.alert('Erro', 'Usuário ou senha inválidos', [
          {
            text: 'Ok',
            onPress: () => {
              this.setState({
                email: '',
                name: '',
              });
            },
          },
        ]);
      }
      return responseJson.data;
    } catch (error) {
      console.log('Erro');
      Alert.alert('Erro', 'Servidor fora de acesso', [
        {
          text: 'Ok',
        },
      ]);
    }
  };

  requestGPSPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Ative a localização',
          message: 'O aplicativo funciona usando a sua localização',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Voce pode usar a geolocalização');
        this.signIn();
      } else {
        console.log('Acesso negado');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  signInToken = async () => {
    try {
      const valuetoken = await AsyncStorage.getItem('token');
      try {
        let response = await fetch(ApiUrl + 'token', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 3000,
          body: JSON.stringify({
            token: valuetoken,
          }),
        });
        let responseJson = await response.json();
        if (responseJson.auth === 'OK') {
          console.log('Entrou');
          this.props.navigation.navigate('HomeApp');
        } else {
        }
        return responseJson.data;
      } catch (error) {
        console.log(error);
      }
    } catch (error) {
      console.log(error);
    }
  };

  async componentDidMount() {
    this.signInToken();
    const backAction = () => {
      //Quando o botão voltar é pressionado

      Alert.alert('ALERTA!', 'Você quer mesmo sair do app?', [
        {
          text: 'Não',
          onPress: () => {
            this.signInToken();
          },
          style: 'cancel',
        },
        {
          text: 'Sim',
          onPress: async () => {
            BackHandler.exitApp();
          },
        },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => {
      backHandler.remove();
    };
  }

  render() {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: '#FF8000'}}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Image
            accessible={true}
            accessibilityLabel="UT Access"
            resizeMode="contain"
            style={{width: '90%', height: '20%'}}
            source={IMAGE.ICON_LOGO}
          />
          <TextInput
            accessible={true}
            accessibilityLabel="Caixa de edição"
            accessibilityHint="Tocar duas vezes para inserir o email cadastrado"
            value={this.state.email}
            style={styles.Imput}
            placeholder="Digite seu email"
            autocorrect={false}
            onChangeText={(text) => {
              this.setState({
                email: text,
              });
            }}
          />
          <TextInput
            accessible={true}
            accessibilityLabel="Caixa de edição"
            accessibilityHint="Tocar duas vezes para inserir a senha cadastrada"
            value={this.state.password}
            style={styles.Imput}
            secureTextEntry={true}
            placeholder="Digite sua senha"
            autocorrect={false}
            onChangeText={(text) => {
              this.setState({
                password: text,
              });
            }}
          />
          <TouchableOpacity
            accessible={true}
            accessibilityLabel="Botão"
            accessibilityHint="Tocar duas vezes para fazer o login"
            style={{
              height: 42,
              width: '75%',
              marginTop: 15,
              backgroundColor: '#000',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 20,
            }}
            onPress={this.requestGPSPermission}
            //onPress={() => {              this.props.navigation.navigate('HomeApp');            }}
          >
            <Text style={{color: '#fff', fontSize: 18}}>Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessible={true}
            accessibilityLabel="Botão"
            accessibilityHint="Tocar duas vezes para cadastrar um novo usuário"
            style={{marginTop: 5}}
            onPress={() => this.props.navigation.navigate('Register')}>
            <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>
              Cadastrar
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  Imput: {
    marginTop: 10,
    padding: 10,
    width: '75%',
    height: 42,
    backgroundColor: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
