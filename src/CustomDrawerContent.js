import React, {Component} from 'react';
import {
  Text,
  View,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {IMAGE} from './constants/Image';
import AsyncStorage from '@react-native-community/async-storage';
export class CustomDrawerContent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      token: '',
    };
    this.getData();
  }

  getData = async () => {
    try {
      const valuename = await AsyncStorage.getItem('name');
      const valuetoken = await AsyncStorage.getItem('token');
      if (valuename !== null) {
        this.setState({name: valuename});
      }
      if (valuetoken !== null) {
        this.setState({token: valuetoken});
      }
    } catch (e) {
      Alert.alert(e);
    }
  };
  render() {
    return (
      <SafeAreaView style={{flex: 1}}>
        <View
          style={{height: 150, alignItems: 'center', justifyContent: 'center'}}>
          <Image
            source={IMAGE.ICON_PROFILE}
            style={{top: 5, height: 120, width: 120, borderRadius: 60}}
          />
          <Text style={{top: 10, fontSize: 18, fontWeight: 'bold'}}>
            {this.state.name}
          </Text>
        </View>

        <ScrollView style={{marginLeft: 10}}>
          <TouchableOpacity
            style={{
              marginTop: 20,
              borderTopWidth: 1,
              borderTopColor: '#000',
            }}
            onPress={() => this.props.navigation.navigate('MenuTab')}>
            <Text style={{fontSize: 16, top: 2}}>Início</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              marginTop: 20,
            }}
            onPress={() => {
              Alert.alert('Alerta', 'Tela em desenvolvimento!', [
                {
                  text: 'Ok',
                  style: 'cancel',
                  onPress: () => {},
                },
              ]);
            }}>
            <Text style={{fontSize: 16}}>Favoritos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              marginTop: 20,
            }}
            onPress={() => this.props.navigation.navigate('Historico')}>
            <Text style={{fontSize: 16}}>Historico</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              marginTop: 20,
            }}
            onPress={() => this.props.navigation.navigate('TestInitMapScreen')}>
            <Text style={{fontSize: 16}}>Dev Mode</Text>
          </TouchableOpacity>
        </ScrollView>
        <TouchableOpacity
          style={{
            borderBottomColor: '#000',
            borderTopWidth: 1,
            height: 42,
            marginTop: 20,
            marginLeft: 7,
            marginEnd: 10,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          onPress={async () => {
            try {
              await AsyncStorage.setItem('token', ' ');
              this.props.navigation.navigate('Login');
            } catch (error) {
              Alert.alert(error);
            }
          }}>
          <Image
            style={{height: 30, width: 20, marginRight: 10}}
            source={IMAGE.ICON_LOGOUT}
            resizeMode="contain"
          />
          <Text style={{fontSize: 16, fontWeight: 'bold'}}>SAIR</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
}
