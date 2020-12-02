import React, {Component} from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import {CustomHeader} from '../index';
import AsyncStorage from '@react-native-community/async-storage';
import {ApiUrl} from '../constants/ApiUrl';

export class RegisterScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      email: '',
      password: '',
      password2: '',
    };
  }

  Register = async () => {
    try {
      let response = await fetch(ApiUrl + 'insert', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: this.state.name,
          email: this.state.email,
          password: this.state.password,
        }),
      });
      let responseJson = await response.json();
      console.log(responseJson.auth);
      if (responseJson.auth === 'OK') {
        Alert.alert('Sucesso', 'Cadastro Concluido', [
          {
            text: 'Ok',
            onPress: () => {
              this.setState({
                password: '',
                password2: '',
                email: '',
                name: '',
              });
            },
          },
        ]);
        try {
          AsyncStorage.multiSet([
            ['name', responseJson.user.name],
            ['id', responseJson.user.id.toString()],
            ['token', responseJson.user.token],
            ['email', responseJson.user.email],
          ]);
          this.props.navigation.navigate('HomeApp');
        } catch (error) {
          Alert.alert(error);
        }
      } else {
        Alert.alert('Erro', responseJson.error, [
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
      console.log(error);
    }
  };

  Preenchimento = async () => {
    if (
      this.state.password !== '' &&
      this.state.password2 !== '' &&
      this.state.name !== '' &&
      this.state.email !== ''
    ) {
      if (this.state.password.length < 8) {
        Alert.alert('Erro', 'A senha precisa ter no mínimo 8 caracteres', [
          {
            text: 'Ok',
            onPress: () => {
              this.setState({
                password: '',
                password2: '',
              });
            },
          },
        ]);
      } else if (this.state.password !== this.state.password2) {
        Alert.alert('Erro', 'As senhas não conferem', [
          {
            text: 'Ok',
            onPress: () => {
              this.setState({
                password2: '',
              });
            },
          },
        ]);
      } else {
        this.Register();
      }
    } else {
      Alert.alert('Erro', 'Preencha todos os campos', [
        {
          text: 'Ok',
        },
      ]);
    }
  };

  render() {
    return (
      <SafeAreaView style={{flex: 1}}>
        <CustomHeader title="Cadastrar" navigation={this.props.navigation} />
        <View style={styles.ViewCenter}>
          <Text style={styles.Text}>Nome de usuário:</Text>
          <TextInput
            value={this.state.name}
            style={styles.Imput}
            placeholder="Digite seu nome"
            autocorrect={false}
            onChangeText={text => {
              this.setState({
                name: text,
              });
            }}
          />
          <Text style={styles.Text}>Email:</Text>
          <TextInput
            value={this.state.email}
            style={styles.Imput}
            placeholder="Digite seu email"
            autocorrect={false}
            onChangeText={text => {
              this.setState({
                email: text,
              });
            }}
          />
          <Text style={styles.Text}>Senha (Mínimo 8 caracteres)</Text>
          <TextInput
            value={this.state.password}
            style={styles.Imput}
            placeholder="Digite sua senha"
            autocorrect={false}
            onChangeText={text => {
              this.setState({
                password: text,
              });
            }}
          />
          <Text style={styles.Text}>Confirme a senha:</Text>
          <TextInput
            value={this.state.password2}
            style={styles.Imput}
            placeholder="Repita sua senha"
            autocorrect={false}
            onChangeText={text => {
              this.setState({
                password2: text,
              });
            }}
          />
          <View style={{marginTop: 10, width: '100%', alignItems: 'center'}}>
            <TouchableOpacity
              style={styles.BotaoCadastrar}
              onPress={this.Preenchimento}>
              <Text style={{color: '#fff'}}>Cadastrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  ViewCenter: {
    flex: 1,
    width: '100%',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
  },
  BotaoCadastrar: {
    marginTop: 10,
    width: 150,
    height: 42,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 5,
    borderRadius: 20,
  },
  Text: {fontWeight: 'bold', fontSize: 18, left: '2%', top: 5},
  Imput: {
    marginTop: 5,
    padding: 10,
    width: '96%',
    height: 42,
    backgroundColor: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    left: '2%',
    borderRadius: 7,
  },
});
