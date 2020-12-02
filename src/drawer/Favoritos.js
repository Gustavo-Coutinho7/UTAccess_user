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
} from 'react-native';
import {CustomHeader} from '../index';
import {IMAGE} from '../constants/Image';
navigator.geolocation = require('@react-native-community/geolocation');
import Geolocation from '@react-native-community/geolocation';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';
import AsyncStorage from '@react-native-community/async-storage';
import {ApiUrl} from '../constants/ApiUrl';

export class Favoritos extends Component {
  constructor(props) {
    super(props);
    this.state = {
      locais: '',
      id: '',
      token: '',
    };
  }

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

  componentDidMount() {
    this.loadFavoritos();
  }

  render() {
    return (
      <SafeAreaView style={{flex: 1}}>
        <CustomHeader title="Histórico" navigation={this.props.navigation} />

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
                this.ItemSelected(item);
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
          keyExtractor={item => item.nome_local}
        />
      </SafeAreaView>
    );
  }
}
