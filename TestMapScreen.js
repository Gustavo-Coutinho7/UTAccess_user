import React, {Component} from 'react';
import {
  Text,
  View,
  SafeAreaView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Vibration,
} from 'react-native';
import Directions from './src/Directions';
import MapView, {Marker} from 'react-native-maps';
import AsyncStorage from '@react-native-community/async-storage';
import Geolocation from '@react-native-community/geolocation';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';
import {IMAGE} from './src/constants/Image';
import {
  LINHAS,
  TerminalChegada,
  TerminalCentro,
  NomeLinhas,
} from './src/itinerario';
import {ApiUrl} from './src/constants/ApiUrl';
import MQTTConnection from './src/mqtt_conection/MQTTConnection';
import {Buffer} from 'buffer';
global.Buffer = Buffer;
import Geocoder from 'react-native-geocoding';
import openMap from 'react-native-open-maps';

export class TestMapScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: null,
      Point_Now: 0,
      region: {
        latitude: -21.2030977,
        longitude: -50.4386507,
        latitudeDelta: 0.00143,
        longitudeDelta: 0.0134,
      },
      testBusCoords: false,
      waypoints: null,
      destino: null,
      getbus: false,
      test_bool: true,
      test_int: 0,
      onBus1: false,
      onBus2: false,
      step: 0,
      dest_title: 'dest',
      dest_coords: null,
      location: null,
      idStart: null,
      idStop: null,
      idLinha1: null,
      idLinha2: null,
      destination: null,
      bus_coordinate: null,
      bus_point: null,
      channel: null,
      step0_bool: true,
      step1_bool: false,
      step2_bool: false,
      step3_bool: false,
      step4_bool: false,
      step5_bool: false,
      step6_bool: false,
      step7_bool: false,
      heading: 0,
      linha1: [],
      linha2: [],
      pitch: 0,
      toStation: false,
      title: '',
      busTostop: null,
      busTostart: null,
      alertStop: false,
      alertEmbarque: false,
      alertStart: false,
    };
  }
  timerID = 0;

  //======================================================================================
  Request(Ok) {
    let linha = this.state.channel.slice(2, 6);
    let sentido = this.state.channel.slice(2, 3);
    // console.log('sentido: ', sentido);
    let channel = 'U-' + linha.toString();
    let id = this.state.id;
    let idLinha1 = this.state.idLinha1;
    let idLinha2 = this.state.idLinha2;
    let Point_Stop = this.state.idStart;
    let On_Bus = Ok;
    let Stop_End = this.state.idStop;
    let message = null;
    //'{"id":10, "Point_Stop":13, "On_Bus": false, "Stop_End": 20}'
    if (sentido === 'B' && idLinha1 === idLinha2) {
      //console.log('indo para o bairro');
      message =
        '{"id":' +
        id +
        ', "Point_Stop":' +
        Point_Stop +
        ', "On_Bus":' +
        On_Bus +
        ', "Stop_End":' +
        Stop_End +
        '}';
    }
    if (sentido === 'C' && idLinha1 !== idLinha2) {
      let terminal = LINHAS[idLinha1].length - 1;
      //console.log('indo para o terminal');
      message =
        '{"id":' +
        id +
        ', "Point_Stop":' +
        Point_Stop +
        ', "On_Bus":' +
        On_Bus +
        ', "Stop_End":' +
        terminal +
        '}';
    }
    if (sentido === 'B' && idLinha1 !== idLinha2) {
      //console.log('saindo do terminal');
      message =
        '{"id":' +
        id +
        ', "Point_Stop": 1' +
        ', "On_Bus":' +
        On_Bus +
        ', "Stop_End":' +
        Stop_End +
        '}';
    }
    //let json = JSON.parse(message);
    //console.log('Request: ', json);
    this.mqttConnect.send(channel, message);
  }

  Alerts(duration) {
    let step = this.state.step;
    if (step < 2) {
      if (this.state.idStart - 1 > this.state.bus_point) {
        console.log('ALERTA indo para o start', duration);
        if (duration < 1 && !this.state.alertStart) {
          this.start();
          Alert.alert(
            'Alerta',
            'Seu ônibus está a menos de 1 minuto do ponto!',
            [
              {
                text: 'Desativar Alerta',
                style: 'cancel',
                onPress: () => {
                  this.stop();
                  this.setState({
                    alertStart: true,
                  });
                },
              },
            ],
          );
        }
      }
      if (this.state.idStart - 1 <= this.state.bus_point) {
        console.log('ALERTA depois do start', duration);
        if (duration > 0.5 && !this.state.alertEmbarque) {
          this.start();
          Alert.alert('Alerta', 'Você não embarcou no ônibus', [
            {
              text: 'Desativar Alerta',
              style: 'cancel',
              onPress: () => {
                this.stop();
                this.setState({
                  alertEmbarque: true,
                });
              },
            },
          ]);
        }
      }
    }
    if (step === 2) {
      console.log('ALERTA indo para o terminal', duration);
      if (duration < 1 && !this.state.alertStop) {
        this.start();
        Alert.alert('Alerta', 'Desça no próximo ponto!', [
          {
            text: 'Desativar Alerta',
            style: 'destructive',
            onPress: () => {
              this.stop();
              this.setState({
                alertStop: true,
              });
            },
          },
        ]);
      }
    }
    if (step === 5) {
      console.log('ALERTA indo para o stop', duration);
      if (duration < 1 && !this.state.alertStop) {
        this.start();
        Alert.alert('Alerta', 'Desça no próximo ponto!', [
          {
            text: 'Desativar Alerta',
            onPress: () => {
              this.stop();
              this.setState({
                alertStop: true,
              });
            },
          },
        ]);
      }
    }
  }

  vibrar() {
    Vibration.vibrate([
      0,
      250,
      1000,
      250,
      1000,
      250,
      1000,
      250,
      1000,
      500,
      1000,
      500,
      1000,
      500,
      1000,
      500,
      1000,
      1000,
      1000,
      1000,
      500,
      1000,
      500,
      1000,
      500,
      1000,
      500,
      1000,
      500,
      1000,
      500,
      1000,
      500,
      1000,
      500,
      1000,
      500,
      1000,
    ]);
  }

  start() {
    clearInterval(this.timerID);
    this.timerID = setInterval(() => {
      console.log('play');
      Vibration.vibrate(500);
    }, 1000);
  }

  stop() {
    clearInterval(this.timerID);
  }

  bus_location(request) {
    //console.log('BusAnalise: ', this.state.step);
    let channel = this.state.channel;
    let linha = channel.slice(2, 6);
    // console.log('Linha: ', linha);
    let idLinha1 = this.state.idLinha1;
    let idLinha2 = this.state.idLinha2;
    let user = null;
    //console.log('Nova mensagem!!!', request);
    //Ex: '{"Point_Now": 1, "Location": {"latitude": -21.194935, "longitude": -50.452241}, "RequestOk": []}'
    let json = JSON.parse(request);
    let Location = json.Location;
    let point = json.Point_Now;
    let requestOk = json.RequestOk;
    let Ok = false;
    if (requestOk !== null) {
      for (var n = 0; n < requestOk.length; n++) {
        let id = parseInt(this.state.id);
        // console.log(id, requestOk[n]);
        if (id === requestOk[n]) {
          Ok = true;
          this.setState({
            RequestOk: Ok,
          });
        }
      }
      if (!Ok && this.state.step < 6) {
        // console.log('============Request!!!===========');
        this.Request(false);
        this.setState({
          RequestOk: Ok,
        });
      }
      //console.log('Request Ok', Ok);
    }

    //====Teste======================================================================
    if (this.state.getbus) {
      user = Location;
      this.setState({
        location: {
          latitude: Location.latitude,
          longitude: Location.longitude,
          latitudeDelta: 0.0043,
          longitudeDelta: 0.034,
        },
      });
    } else {
      user = this.state.location;
    }
    this.setState({
      user: user,
      bus_point: point,
      bus_coordinate: {
        latitude: Location.latitude,
        longitude: Location.longitude,
      },
    });
    //====Analise=======================================================================
    if (user != null) {
      if (!this.state.onBus1 && !this.state.onBus2) {
        //console.log('BusAnalise: onBus false');
        if (
          Math.pow(
            Math.pow(user.latitude - Location.latitude, 2) +
              Math.pow(user.longitude - Location.longitude, 2),
            0.5,
          ) < 0.0001
        ) {
          //console.log('====user on Bus!===');
          this.Request(true);
          if (linha === LINHAS[idLinha1][0].linha && this.state.step !== 4) {
            // console.log('User on Bus1');
            this.setState({
              onBus1: true,
              onBus2: false,
            });
          }
          if (linha === LINHAS[idLinha2][0].linha) {
            // console.log('User on Bus2');
            this.setState({
              onBus1: false,
              onBus2: true,
            });
          }
        } else {
          // console.log('Bus > 10');
          if (this.state.step === 5) {
            this.start();
            Alert.alert('Alerta', 'Você perdeu o ônibus!', [
              {
                text: 'Ok',
                onPress: () => {
                  this.mqttConnect.unsubscribeChannel(this.state.channel);
                  this.stop();
                },
              },
            ]);
          }
          this.setState({
            onBus1: false,
            onBus2: false,
          });
        }
      } else {
        //console.log('BusAnalise: onBus true');
        if (
          this.state.step === 6 &&
          Math.pow(
            Math.pow(user.latitude - Location.latitude, 2) +
              Math.pow(user.longitude - Location.longitude, 2),
            0.5,
          ) < 0.0001 &&
          Math.pow(
            Math.pow(
              user.latitude -
                LINHAS[this.state.idLinha2][this.state.idStop - 1].latitude,
              2,
            ) +
              Math.pow(
                user.longitude -
                  LINHAS[this.state.idLinha2][this.state.idStop - 1].longitude,
                2,
              ),
            0.5,
          ) > 0.00025
        ) {
          //console.log('Deixando de ouvir usuario');
          user = user;
          this.setState({
            location: user,
            title: 'Erro!!!',
          });
          //console.log('O usuario não desceu');
          this.start();
          Alert.alert(
            'Alerta!',
            'Você não desceu no ponto indicado! Dirija-se ao motorista.',
            [
              {
                text: 'Ok',
                onPress: () => {
                  this.stop();
                },
              },
            ],
          );
        } else {
          if (
            this.state.step === 6 &&
            Math.pow(
              Math.pow(user.latitude - Location.latitude, 2) +
                Math.pow(user.longitude - Location.longitude, 2),
              0.5,
            ) > 0.0002 &&
            Math.pow(
              Math.pow(
                user.latitude -
                  LINHAS[this.state.idLinha2][this.state.idStop - 1].latitude,
                2,
              ) +
                Math.pow(
                  user.longitude -
                    LINHAS[this.state.idLinha2][this.state.idStop - 1]
                      .longitude,
                  2,
                ),
              0.5,
            ) < 0.00025
          ) {
            this.setState({
              onBus2: false,
            });
          }
        }
        if (
          this.state.step === 2 ||
          this.state.step === 3 ||
          this.state.step === 5
        ) {
          //console.log('Deixando de ouvir usuario');
          user = user;
          this.setState({
            location: user,
          });
          //===Analise se ususario esta no Onibus ======================================
          /*console.log(
            'distancia: ',
            Math.pow(
              Math.pow(user.latitude - Location.latitude, 2) +
                Math.pow(user.longitude - Location.longitude, 2),
              0.5,
            ),
          );*/
          if (
            Math.pow(
              Math.pow(user.latitude - Location.latitude, 2) +
                Math.pow(user.longitude - Location.longitude, 2),
              0.5,
            ) < 0.0001
          ) {
            //console.log('User onBus! Step: ', this.state.step);
          } else {
            // console.log('User not onBus! Step: ', this.state.step);
            this.setState({
              onBus1: false,
              onBus2: false,
            });
          }
        }
      }
    } else {
      // console.log('BusAnalise: user null');
    }

    // console.log('OnBus', this.state.onBus1, this.state.onBus2);
    this.StepNow(user.latitude, user.longitude);
  }

  onStation() {
    //console.log('Usuario no terminal!');
    this.mqttConnect.unsubscribeChannel(this.state.channel);
    let newchannel = 'B-' + LINHAS[this.state.idLinha2][0].linha;
    this.mqttConnect.subscribeChannel(newchannel);
    this.setState({
      alertStop: false,
      onBus1: false,
      Point_Now: 0,
      channel: newchannel,
    });
  }

  async getData() {
    let dados;
    let channel;
    let title;
    let toStation = false;
    try {
      const valueid = await AsyncStorage.getItem('id');
      if (valueid !== null) {
        this.setState({
          id: valueid,
        });
      }
    } catch (e) {
      Alert.alert(e);
    }
    try {
      const onTravel = await AsyncStorage.getItem('onTravel');
      if (onTravel !== null) {
        try {
          const step = await AsyncStorage.getItem('step');
          if (step !== null) {
            this.setState({
              step: step,
            });
          }
        } catch (e) {
          Alert.alert(e);
        }
      }
    } catch (e) {
      Alert.alert(e);
    }
    try {
      const value = await AsyncStorage.multiGet(['dados', 'channel']).then(
        (response) => {
          dados = response[0][1];
          channel = response[1][1];
          console.log('GET: ', response[0][1]);
        },
      );
      if (value !== null) {
        let json = JSON.parse(dados);
        if (
          LINHAS[json.idLinha1][0].linha.slice(0, 1) === 'B' &&
          json.idStart === 1
        ) {
          toStation = true;
          title = 'Terminal';
        } else {
          await Geocoder.from(
            LINHAS[json.idLinha1][json.idStart - 1].latitude,
            LINHAS[json.idLinha1][json.idStart - 1].longitude,
          )
            .then((json) => {
              var addressComponent = json.results[0].address_components;
              title =
                ' ' +
                addressComponent[1].short_name +
                ' , ' +
                addressComponent[0].short_name +
                ' - ' +
                addressComponent[2].short_name;
            })
            .catch((error) => console.warn(error));
        }

        this.setState({
          toStation: toStation,
          title: 'Destino: ' + title,
          idStart: json.idStart,
          idStop: json.idStop,
          idLinha1: json.idLinha1,
          idLinha2: json.idLinha2,
          destination: json.destination,
          channel: channel,
        });
      }
    } catch (e) {
      this.props.navigation.navigate('HomeApp');
    }
    //Titulo ====================================
  }

  // 0.00001 = 1 metro
  async StepNow(lat, lng) {
    let step = this.state.step;
    let onBus1 = this.state.onBus1;
    let onBus2 = this.state.onBus2;
    let location = null;
    let stepControl = 0;
    let toStation = false;
    //console.log('user: ', lat, lng, 'bus', this.state.bus_coordinate);
    if (lat !== null && lng !== null) {
      location = {latitude: lat, longitude: lng};
    }
    if (
      LINHAS[this.state.idLinha1][0].linha.slice(0, 1) === 'B' &&
      this.state.idStart === 1
    ) {
      // console.log('Inicio no terminal');
      toStation = true;
      this.setState({
        toStation: toStation,
      });
    }
    let startPoint = LINHAS[this.state.idLinha1][this.state.idStart - 1];
    let stopPoint = LINHAS[this.state.idLinha2][this.state.idStop - 1];
    let destino = this.state.destination;
    let waypoints = [];
    if (location !== null) {
      //=======Step4===============================================================
      if (
        Math.pow(
          Math.pow(location.latitude - TerminalChegada.latitude, 2) +
            Math.pow(location.longitude - TerminalChegada.longitude, 2),
          0.5,
        ) < 0.0005 &&
        onBus2 === false
      ) {
        //Usuario no terminal / Rota até o Bus2 / Apenas o marker do Bus se mexe
        console.log('Step4!!!');
        stepControl = 4;
        this.setState({
          title: 'Embarque na linha: ' + LINHAS[this.state.idLinha2][0].linha,
          step: 4,
          step0_bool: false,
          step1_bool: false,
          step2_bool: false,
          step3_bool: false,
          step4_bool: true,
          step5_bool: false,
          step6_bool: false,
          step7_bool: false,
        });
        this.onStation();
      } else if (onBus1 === true) {
        //=======Step3===============================================================
        if (
          this.state.idLinha1 === this.state.idLinha2 &&
          this.state.step !== 4
        ) {
          let title = '';
          await Geocoder.from(
            LINHAS[this.state.idLinha1][this.state.idStop].latitude,
            LINHAS[this.state.idLinha1][this.state.idStop].longitude,
          )
            .then((json) => {
              var addressComponent = json.results[0].address_components;
              title =
                ' ' +
                addressComponent[1].short_name +
                ' , ' +
                addressComponent[0].short_name +
                ' - ' +
                addressComponent[2].short_name;
            })
            .catch((error) => console.warn(error));
          //Usuario no onibus / Rota até o stopPoint
          console.log('Step3!!!');
          stepControl = 3;
          this.setState({
            title: title,
            step: 2,
            step0_bool: false,
            step1_bool: false,
            step2_bool: false,
            step3_bool: true,
            step4_bool: false,
            step5_bool: false,
            step6_bool: false,
            step7_bool: false,
            linha1: LINHAS[this.state.idLinha1],
          });
        }
        //=======Step2===============================================================
        else {
          //Usuario no onibus / Rota até o Terminal
          stepControl = 2;
          console.log('Step2!!!');
          this.setState({
            title: 'Destino: Terminal',
            step: 2,
            step0_bool: false,
            step1_bool: false,
            step2_bool: true,
            step3_bool: false,
            step4_bool: false,
            step5_bool: false,
            step6_bool: false,
            step7_bool: false,
            linha1: LINHAS[this.state.idLinha1],
          });
        }
      }
      //Se o usuario estiver no ponto de onibus
      //=======Step1===============================================================
      else if (
        Math.pow(
          Math.pow(location.latitude - startPoint.latitude, 2) +
            Math.pow(location.longitude - startPoint.longitude, 2),
          0.5,
        ) < 0.0001
      ) {
        if (step !== 1) {
        }
        //Usuario no StartPoint / Rota do Local ao Bus / Apenas o marker do Bus se mexe
        waypoints = LINHAS[this.state.idLinha1].slice(
          this.state.idStart - 3,
          2,
        );
        stepControl = 1;
        if (this.state.bus_point) {
          waypoints = LINHAS[this.state.idLinha1].slice(
            this.state.bus_point + 1,
            this.state.idStart,
          );
        }
        console.log('Step1!!!');
        this.setState({
          title: 'Aguarde o ônibus',
          waypoints: waypoints,
          step: 1,
          step0_bool: false,
          step1_bool: true,
          step2_bool: false,
          step3_bool: false,
          step4_bool: false,
          step5_bool: false,
          step6_bool: false,
          step7_bool: false,
        });
      }

      //=======Step6===============================================================
      if (
        Math.pow(
          Math.pow(location.latitude - stopPoint.latitude, 2) +
            Math.pow(location.longitude - stopPoint.longitude, 2),
          0.5,
        ) < 0.0001
      ) {
        if (step !== 6) {
        }
        //Usuario no StopPoint / Rota até o Destino
        console.log('Step6!!!');
        stepControl = 6;
        this.setState({
          title: 'Você chegou ao ponto final!',
          step: 6,
          step0_bool: false,
          step1_bool: false,
          step2_bool: false,
          step3_bool: false,
          step4_bool: false,
          step5_bool: false,
          step6_bool: true,
          step7_bool: false,
        });
      }
      //=======Step5===============================================================
      else if (onBus2 === true && this.state.step !== 6) {
        let title = '';
        await Geocoder.from(
          LINHAS[this.state.idLinha2][this.state.idStop - 1].latitude,
          LINHAS[this.state.idLinha2][this.state.idStop - 1].longitude,
        )
          .then((json) => {
            var addressComponent = json.results[0].address_components;
            title =
              ' ' +
              addressComponent[1].short_name +
              ' , ' +
              addressComponent[0].short_name +
              ' - ' +
              addressComponent[2].short_name;
          })
          .catch((error) => console.warn(error));
        //Usuario no onibus / Rota até o StopPoint
        console.log('Step5!!!');
        stepControl = 5;
        this.setState({
          title: 'Destino: ' + title,
          step: 5,
          step0_bool: false,
          step1_bool: false,
          step2_bool: false,
          step3_bool: false,
          step4_bool: false,
          step5_bool: true,
          step6_bool: false,
          step7_bool: false,
        });
      }

      //=======Step7===============================================================
      if (stepControl === 6 && onBus2 === false) {
        //Usuario no Destino / Fim da viagem
        console.log('Step7!!!');
        stepControl = 7;
        this.setState({
          step: 7,
          step0_bool: false,
          step1_bool: false,
          step2_bool: false,
          step3_bool: false,
          step4_bool: false,
          step5_bool: false,
          step6_bool: false,
          step7_bool: true,
        });
      }
      //==========VERIFICAÇÕES========================================================
      if (stepControl === 0 && this.state.step !== 6 && this.state.step !== 4) {
        //Usuario errou a rota ================================================================
        if (
          Math.pow(
            Math.pow(location.latitude - startPoint.latitude, 2) +
              Math.pow(location.longitude - startPoint.longitude, 2),
            0.5,
          ) > 0.003
        ) {
          console.log('Usuario errou a rota!!!');
          Alert.alert('Alerta!', 'Parece que você errou o caminho!', [
            {
              text: 'Ok',
              onPress: () => {
                this.mqttConnect.unsubscribeChannel(this.state.channel);
                this.props.navigation.navigate('HomeApp');
              },
            },
          ]);
        } else {
          console.log('Step0!!!');
          this.setState({
            step: 0,
            step0_bool: true,
            step1_bool: false,
            step2_bool: false,
            step3_bool: false,
            step4_bool: false,
            step5_bool: false,
            step6_bool: false,
            step7_bool: false,
          });
        }
      }
    }

    /*console.log(
      'Step: ',
      step,
      'User: ',
      location,
      'OnBus1: ',
      onBus1,
      'OnBus2: ',
      onBus2,
    );*/
  }

  async componentWillUnmount() {
    if (this.state.step < 6) {
      try {
        await AsyncStorage.multiSet([
          ['onTravel', 'true'],
          ['step', this.state.step.toString()],
        ]);
        //this.props.navigation.navigate('TestMapScreen');
      } catch (error) {
        console.log(error);
      }
    }
  }

  async componentDidMount() {
    //=============================================================
    Geocoder.init('AIzaSyDJANTANzQey3Qe8yBpjbskbyH7KnuOqws');
    await this.getData();
    console.log(
      '============',
      'idStart',
      this.state.idStart,
      'idStop',
      this.state.idStop,
      'idLinha1',
      this.state.idLinha1,
      'idLinha2',
      this.state.idLinha2,
      'destination',
      this.state.destination,
      'Chanel',
      this.state.channel,
    );
    //MQTT ==========================================
    this.mqttConnect = new MQTTConnection();
    this.mqttConnect.connect('test.mosquitto.org', 8080);
    this.mqttConnect.onMQTTConnect = () => {
      console.log('Connect');
      this.mqttConnect.subscribeChannel(this.state.channel);
    };
    this.mqttConnect.onMQTTLost = () => {
      console.log('Lost Conmection');
      this.mqttConnect.subscribeChannel(this.state.channel);
    };
    this.mqttConnect.onMQTTMessageArrived = (message) => {
      console.log('Message arrived: ', message);
      console.log('Payload: ', message.payloadString);
      this.bus_location(message.payloadString);
    };
    this.mqttConnect.onMQTTMessageDelivered = (message) => {
      console.log('Message delivered: ', message);
    };

    return () => {
      this.mqttConnect.close();
    };
  }

  render() {
    const {
      location,
      idStart,
      idStop,
      idLinha1,
      idLinha2,
      destination,
      waypoints,
    } = this.state;
    return (
      <SafeAreaView
        style={{height: '100%', alignItems: 'center', backgroundColor: '#fff'}}>
        <View
          style={{
            flexDirection: 'row',
            width: '100%',
            height: '7%',
            backgroundColor: '#000',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 3,
            paddingHorizontal: 20,
          }}>
          <Text
            style={{
              //width: '98%',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: '#0f0',
              fontWeight: 'bold',
            }}
            onPress={() => {
              let test_int = this.state.test_int;
              this.setState({
                test_int: ++test_int,
              });
              if (test_int > 5) {
                this.setState({
                  test_bool: true,
                });
              }
            }}>
            {this.state.title}
          </Text>
        </View>
        <MapView
          initialRegion={this.state.region}
          style={styles.MapView}
          rotateEnabled={false}
          //scrollEnabled={false}
          //zoomEnabled={false}
          showsPointsOfInterest={false}
          showsBuildings={false}
          showsUserLocation={false}
          loadingEnabled={false}
          onMapReady={async () => {
            console.log('Mapa: OK');
          }}
          onLongPress={(data) => {
            if (this.state.testBusCoords) {
              let Point_Now = this.state.Point_Now;
              let channel = 'B-' + this.state.channel.slice(2, 6);
              let message =
                '{"Point_Now":' +
                Point_Now +
                ', "Location":' +
                '{"latitude":' +
                data.nativeEvent.coordinate.latitude +
                ',"longitude":' +
                data.nativeEvent.coordinate.longitude +
                '}, "RequestOk" : [] }';
              //let json = JSON.parse(message);
              //console.log('Request: ', json);
              this.setState({Point_Now: Point_Now});
              // console.log('Bus Linha2');
              this.bus_location(message);
            } else {
              let location = {
                latitude: data.nativeEvent.coordinate.latitude,
                longitude: data.nativeEvent.coordinate.longitude,
              };
              console.log(location);
              this.setState({
                location: location,
              });
              this.StepNow(location.latitude, location.longitude);
            }
          }}
          ref={(el) => (this.MapView = el)}
          //step 0 = usuario indo para o ponto de onibus - no Fit
          //step 1 = usuario no onibus - Fit bus - start
          //setp2 = usuario indo para o ponto de desembarque Fit start - stop
          //step3 = usuario indo para o terminal Fit start - terminal
          //step 4 = usuario no onibus apos o terminal Fit terminal - stop
          //step5 = usuario no ponto de desembarque Fit stop - dest
          //step6 = ususario no destino
        >
          {this.state.bus_coordinate && ( //Pegar tempo do onibus depois do start
            <Directions
              width={0}
              color="#000"
              mode="DRIVING"
              origin={{
                latitude: LINHAS[idLinha1][idStart - 1].latitude,
                longitude: LINHAS[idLinha1][idStart - 1].longitude,
              }}
              destination={this.state.bus_coordinate}
              waypoints={LINHAS[idLinha1].slice(
                idStart - 1,
                this.state.bus_point,
              )}
              //waypoints={{}}
              onError={(error) => {
                console.log('Local Start', error);
              }}
              onReady={(result) => {
                if (
                  idStart - 1 <= this.state.bus_point &&
                  this.state.step < 2
                ) {
                  console.log('Depois do start!!!', result.duration);
                  this.setState({
                    busTostart: result.duration,
                  });
                  this.Alerts(result.duration);
                }
              }}
            />
          )}
          {this.state.bus_coordinate && ( //Pegar tempo do onibus
            <Directions
              width={0}
              color="#000"
              mode="DRIVING"
              origin={this.state.bus_coordinate}
              destination={{
                latitude: LINHAS[idLinha1][idStart - 1].latitude,
                longitude: LINHAS[idLinha1][idStart - 1].longitude,
              }}
              waypoints={LINHAS[idLinha1].slice(
                this.state.bus_point,
                idStart - 1,
              )}
              //waypoints={{}}
              onError={(error) => {
                console.log('Local Start', error);
              }}
              onReady={(result) => {
                if (idStart - 1 > this.state.bus_point && this.state.step < 2) {
                  console.log('Antes do start!!!', result.duration);
                  this.setState({
                    busTostart: result.duration,
                  });
                  this.Alerts(result.duration);
                }
              }}
            />
          )}

          {this.state.toStation &&
          location &&
          this.state.step0_bool && ( //Do local ao Terminal
              <Directions
                width={3}
                color="#FF8000"
                mode="WALKING"
                origin={location}
                destination={{
                  latitude: TerminalCentro.latitude,
                  longitude: TerminalCentro.longitude,
                }}
                //waypoints={{}}
                onError={(error) => {
                  console.log('Local Start', error);
                }}
                onReady={(result) => {
                  console.log('tempo até o terminal: ', result.duration);
                  this.setState({
                    busTostop: result.duration,
                  });
                  this.Alerts(result.duration);
                  this.MapView.animateCamera(
                    {
                      center: location,
                      pitch: 60,
                      heading: this.state.heading,
                      altitude: 200,
                      zoom: 18,
                    },
                    0,
                  );
                  /*this.MapView.fitToCoordinates(result.coordinates, {
                  edgePadding: {right: 50, left: 50, top: 50, bottom: 50},
                });*/
                }}
              />
            )}
          {!this.state.toStation && location && this.state.step0_bool && (
            //Do local ao Start
            <Directions
              width={3}
              color="#FF8000"
              mode="WALKING"
              origin={location}
              destination={{
                latitude: LINHAS[idLinha1][idStart - 1].latitude,
                longitude: LINHAS[idLinha1][idStart - 1].longitude,
              }}
              //waypoints={{}}
              onError={(error) => {
                console.log('Local Start', error);
              }}
              onReady={(result) => {
                //console.log('Step0 Ok');
                this.MapView.animateCamera(
                  {
                    center: location,
                    pitch: 60,
                    heading: this.state.heading,
                    altitude: 200,
                    zoom: 18,
                  },
                  0,
                );
                /*this.MapView.fitToCoordinates(result.coordinates, {
                  edgePadding: {right: 50, left: 50, top: 50, bottom: 50},
                });*/
              }}
            />
          )}
          {this.state.bus_coordinate &&
            this.state.step1_bool &&
            this.state.bus_point &&
            waypoints && (
              //Do bus ao Start
              <Directions
                width={3}
                color="#FF8000"
                mode="DRIVING"
                origin={this.state.bus_coordinate}
                destination={{
                  latitude:
                    LINHAS[this.state.idLinha1][this.state.idStart - 1]
                      .latitude,
                  longitude:
                    LINHAS[this.state.idLinha1][this.state.idStart - 1]
                      .longitude,
                }}
                waypoints={waypoints}
                onError={(error) => {
                  console.log('BusStart', error);
                }}
                onReady={(result) => {
                  //console.log('Step0 Ok');
                  this.MapView.fitToCoordinates(result.coordinates, {
                    edgePadding: {
                      right: 100,
                      left: 100,
                      top: 100,
                      bottom: 100,
                    },
                  });
                }}
              />
            )}
          {this.state.bus_coordinate && this.state.step6_bool && (
            //Do Local ate Stop
            <Directions
              //Essa rota sera invisivel
              width={3}
              color="#FF8000"
              mode="WALKING"
              origin={location}
              destination={this.state.destination}
              onError={(error) => {
                console.log('Step2', error);
              }}
              onReady={(result) => {
                this.MapView.fitToCoordinates(result.coordinates, {
                  edgePadding: {right: 100, left: 100, top: 100, bottom: 100},
                });
              }}
            />
          )}
          {location && this.state.step4_bool && (
            //Usuario no terminal
            <Directions
              //Essa rota sera invisivel
              width={0}
              color="#ff0f"
              mode="DRIVING"
              origin={location}
              destination={{
                latitude: TerminalChegada.latitude,
                longitude: TerminalChegada.longitude,
              }}
              onError={(error) => {
                console.log('Step4', error);
              }}
              onReady={(result) => {
                this.MapView.fitToCoordinates(result.coordinates, {
                  edgePadding: {
                    right: 100,
                    left: 100,
                    top: 100,
                    bottom: 100,
                  },
                });
              }}
            />
          )}
          {this.state.bus_coordinate && this.state.step5_bool && (
            //Do onibus ao Stop pela linha 2
            <Directions
              //Essa rota sera invisivel
              width={3}
              color="#FF8000"
              mode="DRIVING"
              origin={this.state.bus_coordinate}
              destination={{
                latitude: LINHAS[idLinha2][idStop - 1].latitude,
                longitude: LINHAS[idLinha2][idStop - 1].longitude,
              }}
              waypoints={LINHAS[idLinha2].slice(
                this.state.bus_point + 1,
                idStop - 1,
              )}
              onError={(error) => {
                console.log('Step2', error);
              }}
              onReady={(result) => {
                console.log('tempo até o stop: ', result.duration);
                this.setState({
                  busTostop: result.duration,
                });
                this.Alerts(result.duration);
                this.MapView.fitToCoordinates(result.coordinates, {
                  edgePadding: {
                    right: 100,
                    left: 100,
                    top: 100,
                    bottom: 100,
                  },
                });
              }}
            />
          )}
          {this.state.bus_coordinate &&
            this.state.step2_bool &&
            this.state.bus_point && (
              //Do onibus ao terminal
              <Directions
                //Essa rota sera invisivel
                width={3}
                color="#FF8000"
                mode="DRIVING"
                origin={this.state.bus_coordinate}
                destination={{
                  latitude: TerminalChegada.latitude,
                  longitude: TerminalChegada.longitude,
                }}
                waypoints={LINHAS[this.state.idLinha1].slice(
                  this.state.bus_point + 1,
                  LINHAS[this.state.idLinha1].length - 1,
                )}
                onError={(error) => {
                  console.log('Step2', error);
                }}
                onReady={(result) => {
                  console.log('tempo até o terminal: ', result.duration);
                  this.setState({
                    busTostop: result.duration,
                  });
                  this.Alerts(result.duration);
                  this.MapView.fitToCoordinates(result.coordinates, {
                    edgePadding: {
                      right: 100,
                      left: 100,
                      top: 100,
                      bottom: 100,
                    },
                  });
                }}
              />
            )}
          {this.state.bus_coordinate && (
            <Marker
              coordinate={this.state.bus_coordinate}
              anchor={{x: 0.5, y: 1}}
              image={IMAGE.BUS}
            />
          )}
          {location && (
            <Marker
              coordinate={location}
              anchor={{x: 0.5, y: 1}}
              image={IMAGE.MARKER}
            />
          )}
          {!this.state.toStation && idStart && (
            <Marker
              coordinate={{
                latitude: LINHAS[idLinha1][idStart - 1].latitude,
                longitude: LINHAS[idLinha1][idStart - 1].longitude,
              }}
              anchor={{x: 0.5, y: 1}}
              image={IMAGE.STOP}
            />
          )}
          {this.state.toStation && idStart && (
            <Marker
              coordinate={{
                latitude: TerminalCentro.latitude,
                longitude: TerminalCentro.longitude,
              }}
              anchor={{x: 0.5, y: 1}}
              image={IMAGE.STOP}
            />
          )}
          {idStop && (
            <Marker
              coordinate={{
                latitude: LINHAS[idLinha2][idStop - 1].latitude,
                longitude: LINHAS[idLinha2][idStop - 1].longitude,
              }}
              anchor={{x: 0.5, y: 1}}
              image={IMAGE.STOP}
            />
          )}
          {this.state.destination && (
            <Marker
              coordinate={{
                latitude: this.state.destination.latitude,
                longitude: this.state.destination.longitude,
              }}
              anchor={{x: 0.5, y: 1}}
              image={IMAGE.MARKER}
            />
          )}
        </MapView>

        <View
          style={{
            //position: 'absolute',
            backgroundColor: 'dark gray',
            width: '96%',
            justifyContent: 'center',
            alignItems: 'center',
            bottom: 0,
          }}>
          <View style={{flexDirection: 'row'}}>
            <TouchableOpacity
              //Bus Foward ===============================
              style={{
                width: '32%',
                height: 50,
                backgroundColor: '#000',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#fff',
              }}
              onLongPress={() => {
                let test = this.state.testBusCoords;
                this.setState({testBusCoords: !test});
              }}
              onPress={() => {
                let Point_Now = this.state.Point_Now;
                let channel = 'B-' + this.state.channel.slice(2, 6);
                /*console.log(
                  channel.slice(2, 6),
                  LINHAS[this.state.idLinha1][0].linha,
                );*/
                if (
                  channel.slice(2, 6) === LINHAS[this.state.idLinha1][0].linha
                ) {
                  //console.log('Channel Linha 1 =======================');
                  if (
                    this.state.Point_Now <= LINHAS[this.state.idLinha1].length
                  ) {
                    Point_Now = this.state.Point_Now + 1;
                  }
                  let message =
                    '{"Point_Now":' +
                    Point_Now +
                    ', "Location":' +
                    '{"latitude":' +
                    LINHAS[this.state.idLinha1][Point_Now].latitude +
                    ',"longitude":' +
                    LINHAS[this.state.idLinha1][Point_Now].longitude +
                    '}, "RequestOk" : [2, 3, 10] }';
                  //let json = JSON.par, se(message);
                  //console.log('Request: ', json);
                  this.setState({Point_Now: Point_Now});
                  // console.log('Bus Linha1');
                  this.bus_location(message);
                }
                if (
                  channel.slice(2, 6) === LINHAS[this.state.idLinha2][0].linha
                ) {
                  //console.log('Channe Linha 2 =======================');
                  if (
                    this.state.Point_Now <= LINHAS[this.state.idLinha2].length
                  ) {
                    Point_Now = this.state.Point_Now + 1;
                  }
                  let message =
                    '{"Point_Now":' +
                    Point_Now +
                    ', "Location":' +
                    '{"latitude":' +
                    LINHAS[this.state.idLinha2][Point_Now].latitude +
                    ',"longitude":' +
                    LINHAS[this.state.idLinha2][Point_Now].longitude +
                    '}, "RequestOk" : [] }';
                  //let json = JSON.parse(message);
                  //console.log('Request: ', json);
                  this.setState({Point_Now: Point_Now});
                  // console.log('Bus Linha2');
                  this.bus_location(message);
                }
              }}>
              {!this.state.testBusCoords && (
                <Text style={{color: '#0f0', fontWeight: 'bold'}}>BUS +</Text>
              )}
              {this.state.testBusCoords && (
                <View
                  style={{
                    backgroundColor: '#0f0',
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      color: '#000',
                      fontWeight: 'bold',
                    }}>
                    BUS +
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: '32%',
                height: 50,
                backgroundColor: '#000',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#fff',
              }}
              onPress={() => {
                this.Request(true);
              }}>
              <Text style={{color: '#0f0', fontWeight: 'bold'}}>
                Resquest ()
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              //Ativa Step =========================================================
              style={{
                width: '32%',
                height: 50,
                backgroundColor: '#000',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#fff',
              }}
              onPress={() => {
                this.StepNow(
                  this.state.location.latitude,
                  this.state.location.longitude,
                );
              }}>
              <Text style={{color: '#0f0', fontWeight: 'bold'}}>Step()</Text>
            </TouchableOpacity>
          </View>
          <View style={{flexDirection: 'row'}}>
            <TouchableOpacity
              //Bus Back ====================================
              style={{
                width: '32%',
                height: 50,
                backgroundColor: '#000',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#fff',
              }}
              onPress={() => {}}>
              {!this.state.testBusCoords && (
                <Text style={{color: '#0f0', fontWeight: 'bold'}}>BUS -</Text>
              )}
              {this.state.testBusCoords && (
                <View
                  style={{
                    backgroundColor: '#0f0',
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      color: '#000',
                      fontWeight: 'bold',
                    }}>
                    BUS -
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: '32%',
                height: 50,
                backgroundColor: '#000',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#fff',
              }}
              onPress={() => {
                let getbus = !this.state.getbus;
                this.setState({
                  getbus: getbus,
                });
                console.log('GetBUS: ', getbus);
              }}>
              {!this.state.getbus && (
                <Text style={{color: 'red', fontWeight: 'bold'}}>Get Bus</Text>
              )}
              {this.state.getbus && (
                <Text style={{color: '#0f0', fontWeight: 'bold'}}>Get Bus</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: '32%',
                height: 50,
                backgroundColor: '#000',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#fff',
              }}
              onPress={() => {
                let Point_Now = 0;
                let channel = 'B-' + this.state.channel.slice(2, 6);
                let message =
                  '{"Point_Now":' +
                  Point_Now +
                  ', "Location":' +
                  '{"latitude":' +
                  TerminalCentro.latitude +
                  ',"longitude":' +
                  TerminalCentro.longitude +
                  '}, "RequestOk" : [] }';
                //let json = JSON.parse(message);
                //console.log('Request: ', json);
                this.setState({Point_Now: Point_Now});
                // console.log('Bus Linha2');
                this.bus_location(message);
              }}>
              <Text style={{color: '#0f0', fontWeight: 'bold'}}>
                Bus Terminal
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {this.state.step7_bool && (
          <View
            style={{
              borderColor: 'black',
              borderWidth: 1,
              borderRadius: 25,
              borderTopEndRadius: 0,
              borderTopStartRadius: 0,
              backgroundColor: '#fff',
              width: '80%',
              height: '35%',
              bottom: '33%',
              position: 'absolute',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Image
              backgroundColor="#FF8000"
              resizeMode="contain"
              style={{width: '100%', height: '20%'}}
              source={IMAGE.ICON_LOGO}
            />
            <Text style={{color: 'gray', fontSize: 22, fontWeight: 'bold'}}>
              Como foi sua viagem?
            </Text>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                width: '80%',
                bottom: 10,
              }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#FF8000',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 35,
                  width: '25%',
                }}
                onPress={() => {
                  this.props.navigation.navigate('HomeApp');
                }}>
                <Text
                  style={{color: 'white', fontWeight: 'bold', fontSize: 13}}>
                  Boa
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: '#FF8000',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 35,
                  width: '25%',
                }}
                onPress={() => {
                  this.props.navigation.navigate('HomeApp');
                }}>
                <Text
                  style={{color: 'white', fontWeight: 'bold', fontSize: 13}}>
                  Regular
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: '#FF8000',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 35,
                  width: '25%',
                }}
                onPress={() => {
                  this.props.navigation.navigate('HomeApp');
                }}>
                <Text
                  style={{color: 'white', fontWeight: 'bold', fontSize: 13}}>
                  Ruim
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }
}
const styles = StyleSheet.create({
  MapView: {
    flex: 1,
    width: '100%',
    height: '70%',
  },
});
