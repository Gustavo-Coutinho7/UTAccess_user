import React, {Component} from 'react';
import {
  View,
  SafeAreaView,
  Image,
  StatusBar,
  BackHandler,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import {IMAGE} from '../constants/Image';
import {ApiUrl} from '../constants/ApiUrl';

export class LoadScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
    };
  }

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
          console.log('Faça o login');
          this.props.navigation.navigate('Login');
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
        <StatusBar backgroundColor="#D2691E" />
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Image
            resizeMode="contain"
            style={{width: '90%', height: '90%'}}
            source={IMAGE.IMAGELOGO}
          />
        </View>
      </SafeAreaView>
    );
  }
}
