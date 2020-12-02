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
  Animated,
} from 'react-native';
import {CustomHeader} from '../index';
import {IMAGE} from '../constants/Image';
navigator.geolocation = require('@react-native-community/geolocation');
import Geolocation from '@react-native-community/geolocation';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';
import AsyncStorage from '@react-native-community/async-storage';
import {LINHAS, TerminalChegada} from '../itinerario';

export class NotificationsScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {animation: new Animated.Value(0)};
  }
  startAnimation = () => {
    Animated.timing(this.state.animation, {
      useNativeDriver: true,
      toValue: 10080,
      duration: 30000,
    }).start();
  };
  componentDidMount() {}

  render() {
    const rotateInterPolate = this.state.animation.interpolate({
      inputRange: [0, 360],
      outputRange: ['0deg', '-360deg'],
    });
    return (
      <SafeAreaView style={{flex: 1}}>
        <CustomHeader
          title="Notifications"
          navigation={this.props.navigation}
        />
        <Animated.View
          style={{
            backgroundColor: 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
            transform: [{rotate: rotateInterPolate}],
          }}>
          <Image
            style={{height: '25%', margin: 3}}
            source={IMAGE.LOADING}
            resizeMode="contain"
          />
        </Animated.View>
        <TouchableOpacity
          onPress={() => {
            this.startAnimation();
          }}>
          <Text>Animar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            Animated.timing(this.state.animation).stop();
          }}>
          <Text>Parar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
}
