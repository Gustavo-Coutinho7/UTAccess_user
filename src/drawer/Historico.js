import React, {Component} from 'react';
import {
  Text,
  View,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Alert,
  Animated,
} from 'react-native';
import {CustomHeader} from '../index';
import {IMAGE} from '../constants/Image';
navigator.geolocation = require('@react-native-community/geolocation');
import Geolocation from '@react-native-community/geolocation';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';
import AsyncStorage from '@react-native-community/async-storage';
import {ApiUrl} from '../constants/ApiUrl';

export class Historico extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      animation: new Animated.Value(0),
      recentes: '',
      id: '',
      token: '',
    };
  }

  startAnimation = () => {
    Animated.timing(this.state.animation, {
      useNativeDriver: true,
      toValue: 10080,
      duration: 30000,
    }).start();
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

  ItemSelected = async (item) => {
    this.startAnimation();
    this.setState({
      loading: true,
    });
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
        this.props.navigation.navigate('TestInitMapScreen');
      } else {
        await this.addRecente();
        this.GpsIsOff();
        await this.loadRecentes();
      }
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
            num_reg: 1000,
          }),
        });
        let responseJson = await response.json();
        this.setState({
          loading: false,
          recentes: responseJson,
        });
        Animated.timing(this.state.animation).stop();
        return responseJson.data;
      } catch (error) {
        console.log(error);
      }
    } catch (e) {
      Alert.alert(e);
    }
  };
  componentDidMount() {
    this.startAnimation();
    this.loadRecentes();
  }

  render() {
    const rotateInterPolate = this.state.animation.interpolate({
      inputRange: [0, 360],
      outputRange: ['0deg', '-360deg'],
    });
    return (
      <SafeAreaView style={{}}>
        <CustomHeader title="Histórico" navigation={this.props.navigation} />
        <View
          style={{
            padding: 15,
            backgroundColor: '#fff',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
            borderBottomWidth: 1,
          }}>
          <Text
            accessible={true}
            accessibilityLabel="Histórico completo de destinos"
            accessibilityHint="Selecione um destino da lista para iniciar uma viagem"
            style={{fontWeight: 'bold', fontSize: 18}}>
            HISTÓRICO
          </Text>
        </View>
        {!this.state.recentes && (
          <View
            style={{
              width: '100%',
              height: '90%',
              backgroundColor: 'white',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text style={{fontWeight: 'bold', fontSize: 20, color: 'black'}}>
              Carregando ...
            </Text>
          </View>
        )}
        <FlatList
          style={{width: '100%'}}
          data={this.state.recentes}
          renderItem={({item}) => (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                flex: 1,
                width: '100%',
                backgroundColor: '#fff',
                alignItems: 'center',
                borderBottomWidth: 1,
                borderColor: '#000',
              }}
              onPress={async () => {
                console.log(item);
                this.ItemSelected(item);
              }}>
              <View
                style={{
                  borderRightWidth: 1,
                  width: '15%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingRight: 5,
                }}>
                <Image
                  style={{width: '80%', marginLeft: 2}}
                  source={IMAGE.ICON_LOCAL}
                  resizeMode="contain"
                />
                <Text style={{}}>#{item.id}</Text>
              </View>

              <View style={{marginHorizontal: 2, flex: 1, padding: 2}}>
                <Text style={{fontSize: 18, fontWeight: 'bold'}}>
                  {item.title}
                </Text>
                <Text>{item.adress}</Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id.toString()}
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
