import React, {Component} from 'react';
import {
  ImageBackground,
  Text,
  StyleSheet,
  View,
  TextInput,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  StatusBar,
  Animated,
} from 'react-native';
import {CustomHeader} from '../index';
import {IMAGE} from '../constants/Image';
import AsyncStorage from '@react-native-community/async-storage';
import Search from '../search';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';
import {ApiUrl} from '../constants/ApiUrl';

export class HomeScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      animation: new Animated.Value(0),
      loading: true,
      homeAdress: 'Toque para inserir um endereço',
      workAdress: 'Toque para inserir um endereço',
      adress: '',
      locais: [],
      recentes: [],
      id: '',
      token: '',
      destination: [],
    };
  }

  startAnimation = () => {
    Animated.timing(this.state.animation, {
      useNativeDriver: true,
      toValue: 10080,
      duration: 30000,
    }).start();
  };

  async SetData() {
    try {
      await AsyncStorage.multiSet([
        ['distancia', ''],
        ['tempoEmb', ''],
        ['tempoDes', ''],
      ]);
    } catch (error) {
      console.log(error);
    }
  }

  LocationconfigsOk = async (data, {geometry}) => {
    try {
      const valuedist = await AsyncStorage.getItem('distancia');
      const valuetempoEmb = await AsyncStorage.getItem('tempoEmb');
      const valuetempoDes = await AsyncStorage.getItem('tempoDes');
      console.log(valuedist, valuetempoEmb, valuetempoDes);
      if (valuedist != null && valuetempoDes != null && valuetempoEmb != null) {
        this.handleLocationSelected(data, {geometry});
      } else {
        Alert.alert(
          'Aviso',
          'Ajuste as configurações antes de iniciar uma viagem',
          [
            {
              text: 'Ir',
              onPress: () => {
                this.props.navigation.navigate('Configurações');
              },
            },
          ],
        );
      }
    } catch {
      (e) => {
        Alert.alert(e);
      };
    }
  };

  ItemconfigsOk = async (item) => {
    try {
      const valuedist = await AsyncStorage.getItem('distancia');
      const valuetempoEmb = await AsyncStorage.getItem('tempoEmb');
      const valuetempoDes = await AsyncStorage.getItem('tempoDes');
      console.log(valuedist, valuetempoEmb, valuetempoDes);
      if (valuedist != null && valuetempoDes != null && valuetempoEmb != null) {
        this.ItemSelected(item);
      } else {
        Alert.alert(
          'Aviso',
          'Ajuste as configurações antes de iniciar uma viagem',
          [
            {
              text: 'Ir',
              onPress: () => {
                this.props.navigation.navigate('Configurações');
              },
            },
          ],
        );
      }
    } catch {
      (e) => {
        Alert.alert(e);
      };
    }
  };

  loadFavoritos = async () => {
    try {
      const valueid = await AsyncStorage.getItem('id');
      const valuetoken = await AsyncStorage.getItem('token');
      if (valueid !== null) {
        this.setState({id: valueid});
      }
      if (valuetoken !== null) {
        this.setState({token: valuetoken});
      }
      try {
        let response = await fetch(ApiUrl + 'favoritos/' + this.state.id, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 2000,
          body: JSON.stringify({
            token: this.state.token,
          }),
        });
        let responseJson = await response.json();
        try {
          this.setState({
            locais: responseJson,
          });
        } catch (error) {
          console.log(error);
        }

        return responseJson.data;
      } catch (error) {}
    } catch (e) {
      Alert.alert(e);
    }
  };

  loadRecentes = async () => {
    try {
      const valueid = await AsyncStorage.getItem('id');
      const valuetoken = await AsyncStorage.getItem('token');
      if (valueid !== null) {
        this.setState({id: valueid});
      }
      if (valuetoken !== null) {
        this.setState({token: valuetoken});
      }
      try {
        let response = await fetch(ApiUrl + 'recentes/' + this.state.id, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 2000,
          body: JSON.stringify({
            token: this.state.token,
            num_reg: 5,
          }),
        });
        let responseJson = await response.json();
        try {
          this.setState({
            recentes: responseJson,
          });
        } catch (error) {
          console.log(error);
        }
        Animated.timing(this.state.animation).stop();
        console.log('STOP!');
        this.setState({
          loading: false,
        });
        return responseJson.data;
      } catch (error) {
        console.log(error);
      }
    } catch (e) {
      Alert.alert(e);
    }
  };

  addRecente = async () => {
    try {
      const valueid = await AsyncStorage.getItem('id');
      const valuetoken = await AsyncStorage.getItem('token');
      if (valueid !== null) {
        this.setState({id: valueid});
      }
      if (valuetoken !== null) {
        this.setState({token: valuetoken});
      }
      try {
        let response = await fetch(ApiUrl + 'addRecente/' + this.state.id, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 3000,
          body: JSON.stringify({
            token: this.state.token,
            latitude: this.state.destination.latitude,
            longitude: this.state.destination.longitude,
            title: this.state.destination.title,
            adress: this.state.adress,
          }),
        });
        let responseJson = await response.json();
        await this.loadRecentes();
        this.props.navigation.navigate('InitMapScreen');
        return responseJson.auth;
      } catch (error) {
        console.log(error);
      }
    } catch (e) {
      Alert.alert(e);
    }
  };

  handleLocationSelected = async (data, {geometry}) => {
    this.startAnimation();
    this.setState({loading: true});
    console.log(geometry);
    const {
      location: {lat: latitude, lng: longitude},
    } = geometry;
    this.setState({
      adress: data.structured_formatting.secondary_text,
      destination: {
        latitude,
        longitude,
        title: data.structured_formatting.main_text,
      },
    });
    console.log(
      'Hello',
      latitude,
      longitude,
      data.structured_formatting.main_text,
    );
    if (data.structured_formatting.main_text === this.state.recentes[0].title) {
      console.log('Nem salvei');
      this.setState({
        loading: false,
      });
      Animated.timing(this.state.animation).stop();
      console.log('STOP!');
      this.props.navigation.navigate('InitMapScreen');
    } else {
      await this.addRecente();
      this.GpsIsOff();
      await this.loadRecentes();
    }
  };

  GpsIsOff = async () => {
    RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
      interval: 10000,
      fastInterval: 5000,
    })
      .then((data) => {
        console.log(data);
        // The user has accepted to enable the location services
        // data can be :
        //  - "already-enabled" if the location services has been already enabled
        //  - "enabled" if user has clicked on OK button in the popup
      })
      .catch((err) => {
        this.GpsIsOff();
        // The user has not accepted to enable the location services or something went wrong during the process
        // "err" : { "code" : "ERR00|ERR01|ERR02", "message" : "message"}
        // codes :
        //  - ERR00 : The user has clicked on Cancel button in the popup
        //  - ERR01 : If the Settings change are unavailable
        //  - ERR02 : If the popup has failed to open
      });
  };

  ItemSelected = async (item) => {
    this.startAnimation();
    this.setState({loading: true});
    //se não houver latitude latitude
    if (!item.latitude) {
      this.props.navigation.navigate('Notifications');
    } else {
      let destination = {
        latitude: item.latitude,
        longitude: item.longitude,
        title: item.title,
      };
      this.setState({
        adress: item.adress,
        destination: destination,
      });
      if (item.title === this.state.recentes[0].title) {
        console.log('Nem salvei');
        this.setState({
          loading: false,
        });
        Animated.timing(this.state.animation).stop();
        console.log('STOP!');
        this.props.navigation.navigate('InitMapScreen');
      } else {
        await this.addRecente();
        this.GpsIsOff();
        await this.loadRecentes();
      }
    }
  };

  async onTravel() {
    try {
      const onTravel = await AsyncStorage.getItem('onTravel');
      if (onTravel === 'true') {
        Alert.alert(
          'Alerta',
          'Parece que você está no meio de uma viagem, deseja continuar?',
          [
            {
              text: 'Sim',
              style: 'cancel',
              onPress: () => {
                this.props.navigation.navigate('MapScreen');
              },
            },
            {
              text: 'Não',
              style: 'cancel',
              onPress: async () => {
                try {
                  await AsyncStorage.multiSet([
                    ['onTravel', 'false'],
                    ['step', ' '],
                  ]);
                  //this.props.navigation.navigate('TestMapScreen');
                } catch (error) {
                  console.log(error);
                }
              },
            },
          ],
        );
      }
    } catch (e) {
      Alert.alert(e);
    }
  }

  async componentDidMount() {
    await this.SetData();
    this.startAnimation();
    await this.onTravel();
    await this.loadFavoritos();
    await this.loadRecentes();
    this.GpsIsOff();
  }

  render() {
    const rotateInterPolate = this.state.animation.interpolate({
      inputRange: [0, 360],
      outputRange: ['0deg', '-360deg'],
    });
    return (
      <SafeAreaView style={{flex: 1}}>
        <CustomHeader
          title=""
          isHome={true}
          navigation={this.props.navigation}
        />
        <KeyboardAvoidingView
          style={{
            backgroundColor: '#fff',
            flex: 1,
            justifyContent: 'flex-start',
            alignItems: 'center',
          }}>
          <StatusBar backgroundColor="#D2691E" />
          <View
            style={{
              width: '100%',
              height: '37%',
            }}>
            <ImageBackground
              style={{
                height: '100%',
                width: '100%',
              }}
              source={IMAGE.ICON_BACKGROUND}
            />
          </View>
          <View
            style={{
              flex: 1,
              width: '100%',
              alignItems: 'flex-start',
              backgroundColor: '#FF8000',
            }}>
            <View
              style={{
                flex: 1,
                backgroundColor: '#E6E6E6',
                width: '100%',
              }}>
              <View
                style={{
                  backgroundColor: '#C7C6C6',
                  width: '100%',
                  height: 20,
                  justifyContent: 'center',
                }}>
                <Text
                  accessible={true}
                  accessibilityLabel="Lista de Locais Favoritos"
                  accessibilityHint="Selecione um destino ou adicione aos favoritos"
                  style={{
                    paddingLeft: 10,
                    fontSize: 14,
                    fontWeight: 'bold',
                    borderBottomWidth: 1,
                    borderBottomColor: '#000',
                  }}>
                  FAVORITOS
                </Text>
              </View>
              <FlatList
                style={{width: '100%'}}
                data={this.state.locais}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      height: 55,
                      width: '100%',
                      backgroundColor: '#fff',
                      alignItems: 'center',
                      borderBottomWidth: 1,
                      borderColor: '#000',
                    }}
                    onPress={async () => {
                      Alert.alert('Alerta', 'Tela em desenvolvimento!', [
                        {
                          text: 'Ok',
                          style: 'cancel',
                          onPress: () => {},
                        },
                      ]);
                    }}>
                    <Image
                      style={{width: '8%', marginLeft: 7}}
                      source={IMAGE.ICON_LOCAL}
                      resizeMode="contain"
                    />
                    <View style={{marginLeft: 15}}>
                      <Text style={{fontSize: 18, fontWeight: 'bold'}}>
                        {item.nome_local}
                      </Text>
                      <Text>{item.endereco}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.nome_local}
              />
              <TouchableOpacity
                style={{
                  borderTopColor: '#000',
                  borderBottomColor: '#000',
                  borderTopWidth: 1,
                  borderBottomWidth: 1,
                  backgroundColor: '#fff',
                  width: '100%',
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => {
                  this.props.navigation.navigate('Notifications');
                }}
                accessible={true}
                accessibilityLabel="Botão"
                accessibilityHint="Adicionar novo destino a lista de favoritos">
                <Text style={{fontSize: 14, fontWeight: 'bold'}}>
                  Adicionar
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: '#E6E6E6',
                width: '100%',
              }}>
              <View
                style={{
                  backgroundColor: '#C7C6C6',
                  width: '100%',
                  height: 20,
                  justifyContent: 'center',
                }}
                accessible={true}
                accessibilityLabel="Lista de locais recentes"
                accessibilityHint="Selecione um destino a partir da lista dos 5 mais recentes">
                <Text
                  style={{
                    paddingLeft: 10,
                    fontSize: 14,
                    fontWeight: 'bold',
                    borderBottomWidth: 1,
                    borderBottomColor: '#000',
                  }}>
                  RECENTES
                </Text>
              </View>
              <FlatList
                style={{width: '100%'}}
                data={this.state.recentes}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      height: 55,
                      width: '100%',
                      backgroundColor: '#fff',
                      alignItems: 'center',
                      borderBottomWidth: 1,
                      borderColor: '#000',
                    }}
                    onPress={async () => {
                      await this.ItemconfigsOk(item);
                      //this.ItemSelected(item);
                    }}>
                    <Image
                      style={{width: '8%', marginLeft: 7}}
                      source={IMAGE.ICON_LOCAL}
                      resizeMode="contain"
                    />
                    <View style={{marginLeft: 15}}>
                      <Text style={{fontSize: 18, fontWeight: 'bold'}}>
                        {item.title}
                      </Text>
                      <Text>{item.adress}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id.toString()}
              />
              <TouchableOpacity
                style={{
                  borderTopColor: '#000',
                  borderBottomColor: '#000',
                  borderTopWidth: 1,
                  borderBottomWidth: 1,
                  backgroundColor: '#fff',
                  width: '100%',
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => {
                  this.props.navigation.navigate('Historico');
                }}
                accessible={true}
                accessibilityLabel="Botão"
                accessibilityHint="Ver histórico completo de destinos">
                <Text style={{fontSize: 14, fontWeight: 'bold'}}>
                  Histórico
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

        <Search
          style={{
            position: 'absolute',
          }}
          onLocationSelected={
            this.LocationconfigsOk
            //this.handleLocationSelected
          }
        />

        {this.state.loading && (
          <View
            style={{
              position: 'absolute',
              opacity: 0.5,
              backgroundColor: '#000',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              width: '100%',
            }}
          />
        )}
        {this.state.loading && (
          <View
            style={{
              position: 'absolute',
              backgroundColor: 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              width: '100%',
            }}>
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 30,
                justifyContent: 'center',
                alignItems: 'center',
                top: '5%',
                height: '30%',
                width: '70%',
              }}>
              <Animated.View
                style={{
                  backgroundColor: 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transform: [{rotate: rotateInterPolate}],
                }}>
                <Image
                  style={{height: '60%', margin: 3}}
                  source={IMAGE.LOADING}
                  resizeMode="contain"
                />
              </Animated.View>

              <Text
                style={{color: '#ff6000', fontWeight: 'bold', fontSize: 16}}>
                Carregando ...
              </Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  Imput: {
    marginBottom: '10%',
    padding: 15,
    width: '96%',
    height: 48,
    backgroundColor: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    borderRadius: 20,
  },
});
