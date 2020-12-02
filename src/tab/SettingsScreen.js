import React, {Component} from 'react';
import {
  Text,
  View,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import {CustomHeader} from '../index';
import AsyncStorage from '@react-native-community/async-storage';

export class SettingsScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: '',
      token: '',
      distancia: '300',
      tempoEmb: '30',
      tempoDes: '30',
    };
  }

  async SetData() {
    try {
      await AsyncStorage.multiSet([
        ['distancia', this.state.distancia],
        ['tempoEmb', this.state.tempoEmb],
        ['tempoDes', this.state.tempoDes],
      ]);
      Alert.alert(
        'Dados Salvos!',
        'Suas preferências foram salvas com sucesso!',
        [
          {
            text: 'Ok',
            onPress: () => {
              this.props.navigation.goBack();
            },
          },
        ],
      );
    } catch (error) {
      console.log(error);
    }
  }

  async GetData() {
    try {
      const valuedist = await AsyncStorage.getItem('distancia');
      const valuetempoEmb = await AsyncStorage.getItem('tempoEmb');
      const valuetempoDes = await AsyncStorage.getItem('tempoDes');
      console.log(valuedist, valuetempoEmb, valuetempoDes);
      if (valuetempoDes !== null) {
        this.setState({
          tempoDes: valuetempoDes,
        });
      } else {
        this.setState({
          tempoDes: this.state.tempoDes,
        });
      }
      if (valuedist !== null) {
        this.setState({
          distancia: valuedist,
        });
      } else {
        this.setState({
          distancia: this.state.distancia,
        });
      }
      if (valuetempoEmb !== null) {
        this.setState({
          tempoEmb: valuetempoEmb,
        });
      } else {
        this.setState({
          tempoEmb: this.state.tempoEmb,
        });
      }
    } catch (e) {
      Alert.alert(e);
    }
  }

  ValidarTexto() {
    console.log('Validar', this.state.distancia);
    let intDist = parseInt(this.state.distancia);
    let intEmb = parseInt(this.state.tempoEmb);
    let intDes = parseInt(this.state.tempoDes);
    if (intDist < 100 || intDist > 1000) {
      Alert.alert('Erro', 'A distância deve estar entre 100 e 1000 metros', [
        {
          text: 'Ok',
          onPress: () => {},
        },
      ]);
    } else if (intEmb < 30 || intEmb > 150) {
      Alert.alert(
        'Erro',
        'O tempo de embarque deve estar entre 30 e 150 segundos',
        [
          {
            text: 'Ok',
            onPress: () => {},
          },
        ],
      );
    } else if (intDes < 30 || intDes > 150) {
      Alert.alert(
        'Erro',
        'O tempo de desembarque deve estar entre 30 e 150 segundos',
        [
          {
            text: 'Ok',
            onPress: () => {},
          },
        ],
      );
    } else {
      this.SetData();
    }
  }

  componentDidMount() {
    this.GetData();
  }

  render() {
    return (
      <SafeAreaView style={{flex: 1}}>
        <CustomHeader
          title="Settings"
          isHome={false}
          navigation={this.props.navigation}
        />
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#DCDCDC',
          }}>
          <View
            style={{
              backgroundColor: '#fff',
              height: 40,
              borderBottomWidth: 1,
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              style={{
                fontWeight: 'bold',
                fontSize: 16,
              }}>
              Configurações
            </Text>
          </View>
          <View style={{width: '100%', flex: 1}}>
            <View
              style={{
                flex: 1,
                width: '100%',
                justifyContent: 'flex-start',
                alignItems: 'center',
                padding: 5,
              }}>
              <Text
                accessible={true}
                accessibilityLiveRegion="polite"
                style={{width: '100%', fontWeight: 'bold', fontSize: 14}}>
                Distância máxima a pé: {this.state.distancia} metros
              </Text>
              <TextInput
                maxLength={4}
                accessible={true}
                accessibilityLabel="Caixa de edição"
                accessibilityHint="Tocar duas vezes para inserir a distancia, valor minimo 100 metros, valor maximo 1000 metros"
                value={this.state.distancia}
                style={{
                  alignItems: 'center',
                  marginTop: 10,
                  padding: 10,
                  width: '75%',
                  height: 42,
                  backgroundColor: '#fff',
                  fontWeight: 'bold',
                  fontSize: 16,
                }}
                placeholder={this.state.distancia}
                autocorrect={false}
                clearTextOnFocus={true}
                keyboardType="number-pad"
                onChangeText={(text) => {
                  this.setState({
                    distancia: text,
                  });
                }}
              />
            </View>
            <View
              style={{
                flex: 1,
                width: '100%',
                justifyContent: 'flex-start',
                alignItems: 'center',
                padding: 5,
              }}>
              <Text
                accessible={true}
                accessibilityLiveRegion="polite"
                style={{width: '100%', fontWeight: 'bold', fontSize: 14}}>
                Alerta {this.state.tempoEmb} segundos antes do embarque
              </Text>
              <TextInput
                maxLength={3}
                keyboardType="number-pad"
                accessible={true}
                accessibilityLabel="Caixa de edição"
                accessibilityHint="Tocar duas vezes para innserir o tempo em segundos, valor minimo 30 segundos, valor maximo 150 segundos"
                value={this.state.tempoEmb}
                style={{
                  marginTop: 10,
                  padding: 10,
                  width: '75%',
                  height: 42,
                  backgroundColor: '#fff',
                  fontWeight: 'bold',
                  fontSize: 16,
                }}
                placeholder={this.state.tempoEmb}
                autocorrect={false}
                clearTextOnFocus={true}
                onChangeText={(text) => {
                  this.setState({
                    tempoEmb: text,
                  });
                }}
              />
            </View>
            <View
              style={{
                flex: 1,
                width: '100%',
                justifyContent: 'flex-start',
                alignItems: 'center',
                padding: 5,
              }}>
              <Text
                accessible={true}
                accessibilityLiveRegion="polite"
                style={{width: '100%', fontWeight: 'bold', fontSize: 14}}>
                Alerta {this.state.tempoDes} segundos antes do desembarque
              </Text>
              <TextInput
                maxLength={3}
                keyboardType="number-pad"
                accessible={true}
                accessibilityLabel="Caixa de edição"
                accessibilityHint="Tocar duas vezes para innserir o tempo em segundos, valor minimo 30 segundos, valor maximo 150 segundos"
                value={this.state.tempoDes}
                style={{
                  marginTop: 10,
                  padding: 10,
                  width: '75%',
                  height: 42,
                  backgroundColor: '#fff',
                  fontWeight: 'bold',
                  fontSize: 16,
                }}
                placeholder={this.state.tempoDes}
                autocorrect={false}
                onChangeText={(text) => {
                  this.setState({
                    tempoDes: text,
                  });
                }}
              />
            </View>
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: '#ff8000',
              height: 30,
              width: 100,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              bottom: 5,
            }}
            onPress={() => {
              this.ValidarTexto();
            }}>
            <Text style={{color: 'white', fontWeight: 'bold'}}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}
