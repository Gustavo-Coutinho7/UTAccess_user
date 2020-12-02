import React, {Component} from 'react';
import {
  Text,
  View,
  SafeAreaView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
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
  NomeLinhas,
  TerminalCentro,
} from './src/itinerario';
import {ApiUrl} from './src/constants/ApiUrl';
import MQTTConnection from './src/mqtt_conection/MQTTConnection';
import {Buffer} from 'buffer';
global.Buffer = Buffer;
import Geocoder from 'react-native-geocoding';
import openMap from 'react-native-open-maps';

export class InitMapScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tempoDes: null,
      tempoEmb: null,
      distancia: null,
      NoBus: false,
      durationBus_Pnt: 0,
      durationUser_Pnt: 0,
      duration: 0,
      PointIn_inf: null,
      Bus_inf: null,
      PointOut_inf: null,
      linhas: [],
      channel: 'UT',
      adress: '',
      id: '',
      token: '',
      region: {
        latitude: -21.2030977,
        longitude: -50.4386507,
        latitudeDelta: 0.00143,
        longitudeDelta: 0.0134,
      },
      dest_title: '',
      destination: null,
      location: null,
      StopPoint: null,
      StartPoint: null,
      WayPointsAS: null,
      WayPointsBS: null,
      HasRoute: false,
      bus_coordinate: null,
      PointOut: null,
      PointIn: null,
      bus_point: null,
    };
  }

  async GetData() {
    try {
      const valuedist = await AsyncStorage.getItem('distancia');
      const valuetempoEmb = await AsyncStorage.getItem('tempoEmb');
      const valuetempoDes = await AsyncStorage.getItem('tempoDes');
      console.log(valuedist, valuetempoEmb, valuetempoDes);
      if (
        valuetempoDes !== null &&
        valuedist !== null &&
        valuetempoEmb !== null
      ) {
        this.setState({
          tempoDes: valuetempoDes,
          tempoEmb: valuetempoEmb,
          distancia: valuedist,
        });
      } else {
        Alert.alert('Alerta', 'Parece que algo deu errado!', [
          {
            text: 'Ok',
            onPress: () => {
              this.props.navigation.navigate('HomeApp');
            },
          },
        ]);
      }
    } catch (e) {
      Alert.alert(e);
    }
  }

  GetPoints(destination, location) {
    let PointIn = null;
    let PointOut = null;
    let WayPointsAS = null; //AfterStation
    let WayPointsBS = null; //BeforeStation
    //================================
    let StopdistB = -1;
    let StopNumB = -1;
    let StopIndexB = -1;
    let StopLinhaB = '';
    let latStopB = -1;
    let lngStopB = -1;
    let StopPointB = [];
    let StartdistB = -1;
    let StartNumB = -1;
    let StartIndexB = -1;
    let StartLinhaB = '';
    let latStartB;
    let lngStartB;
    let StartPointB = [];
    //===================================
    let StopdistC = -1;
    let StopNumC = -1;
    let StopIndexC = -1;
    let StopLinhaC = '';
    let latStopC = -1;
    let lngStopC = -1;
    let StopPointC = [];
    let StartdistC = -1;
    let StartNumC = -1;
    let StartIndexC = -1;
    let StartLinhaC = '';
    let latStartC;
    let lngStartC;
    let StartPointC = [];
    // ============================================================
    let Id;
    let Id2;

    let ca_coDest =
      Math.pow(location.latitude - destination.latitude, 2) +
      Math.pow(location.longitude - destination.longitude, 2);
    let distDest = Math.pow(ca_coDest, 0.5);
    if (distDest < this.state.distancia / 100000) {
      Alert.alert('Alerta', 'Você está perto do destino selecionado', [
        {
          text: 'Ok',
          onPress: () => {},
        },
      ]);
      return;
    }

    for (var n = 0; n < LINHAS.length; n++) {
      let LINHA = LINHAS[n];
      //Percorrendo todos as linhas
      let ca_coTerminal =
        Math.pow(destination.latitude - TerminalChegada.latitude, 2) +
        Math.pow(destination.longitude - TerminalChegada.longitude, 2);
      let distTerminal = Math.pow(ca_coTerminal, 0.5);
      if (distTerminal < this.state.distancia / 100000) {
        //Se a distancia do destino for menor que 300 m do terminal
        StopPointC[0] = {
          id: -1,
        };
        StopPointB[0] = {
          id: -1,
        };
        console.log('Desça no terminal e vá a pé');
      } else {
        //Se a distancia do destino for maior que 300 m do terminal
        for (var i = 0; i < LINHA.length; i++) {
          //Percorrendo todos os pontos
          let ca_co =
            Math.pow(destination.latitude - LINHA[i].latitude, 2) +
            Math.pow(destination.longitude - LINHA[i].longitude, 2);
          let hip = Math.pow(ca_co, 0.5);

          if (
            LINHA[i].linha.slice(0, 1) === 'B' &&
            hip < this.state.distancia / 100000
          ) {
            //Se o ponto for sentido bairro e estiver a menos que 300 metros do destino
            if (StopdistB === -1) {
              StopNumB = LINHA[i].id;
              latStopB = LINHA[i].latitude;
              lngStopB = LINHA[i].longitude;
              StopLinhaB = LINHA[i].linha;
              StopdistB = hip;
              StopIndexB = n;
            } else {
              if (StopdistB > hip) {
                //Se a distancia desse ponto é menor que a do ultimo ponto salvo
                StopNumB = LINHA[i].id;
                latStopB = LINHA[i].latitude;
                lngStopB = LINHA[i].longitude;
                StopLinhaB = LINHA[i].linha;
                StopdistB = hip;
                StopIndexB = n;
              }
            }
          }
          //======================================================================================
          if (
            LINHA[i].linha.slice(0, 1) === 'C' &&
            hip < this.state.distancia / 100000
          ) {
            //Se o ponto for sentido centro e estiver a menos que 300 metros do destino
            if (StopdistC === -1) {
              StopNumC = LINHA[i].id;
              latStopC = LINHA[i].latitude;
              lngStopC = LINHA[i].longitude;
              StopLinhaC = LINHA[i].linha;
              StopdistC = hip;
              StopIndexC = n;
            } else {
              if (StopdistC > hip) {
                //Se a distancia desse ponto é menor que a do ultimo ponto salvo
                StopNumC = LINHA[i].id;
                latStopC = LINHA[i].latitude;
                lngStopC = LINHA[i].longitude;
                StopLinhaC = LINHA[i].linha;
                StopdistC = hip;
                StopIndexC = n;
              }
            }
          }
        }
        //Ainda esta dentro do laço for
        //Se algum ponto satisfez as condições ele é salvo no array como possivel ponto final da rota
        if (StopdistB !== -1) {
          StopPointB[StopPointB.length] = {
            linha: StopLinhaB,
            id: StopIndexB,
            num: StopNumB,
            latitude: latStopB,
            longitude: lngStopB,
            dist: StopdistB,
          };
        }
        if (StopdistC !== -1) {
          StopPointC[StopPointC.length] = {
            linha: StopLinhaC,
            id: StopIndexC,
            num: StopNumC,
            latitude: latStopC,
            longitude: lngStopC,
            dist: StopdistC,
          };
        }
      }
      //Zera as variaveis para uma nova linha ser analisada
      StopdistB = -1;
      StopdistC = -1;
      //==================================================================
      for (var i = 0; i < LINHA.length; i++) {
        //Percorrendo todos os pontos
        let ca_co =
          Math.pow(location.latitude - LINHA[i].latitude, 2) +
          Math.pow(location.longitude - LINHA[i].longitude, 2);
        let hip = Math.pow(ca_co, 0.5);
        if (
          LINHA[i].linha.slice(0, 1) === 'B' &&
          hip < this.state.distancia / 100000
        ) {
          //Se o ponto for sentido bairro e estiver a menos que 300 metros do local atual
          if (StartdistB === -1) {
            StartNumB = LINHA[i].id;
            latStartB = LINHA[i].latitude;
            lngStartB = LINHA[i].longitude;
            StartLinhaB = LINHA[i].linha;
            StartdistB = hip;
            StartIndexB = n;
          } else {
            if (StartdistB > hip) {
              StartNumB = LINHA[i].id;
              latStartB = LINHA[i].latitude;
              lngStartB = LINHA[i].longitude;
              StartLinhaB = LINHA[i].linha;
              StartdistB = hip;
              StartIndexB = n;
            }
          }
        }
        if (LINHA[i].linha.slice(0, 1) === 'C' && hip < 0.003) {
          //Se o ponto for sentido centro e estiver a menos que 150 metros do local atual
          if (StartdistC === -1) {
            StartNumC = LINHA[i].id;
            latStartC = LINHA[i].latitude;
            lngStartC = LINHA[i].longitude;
            StartLinhaC = LINHA[i].linha;
            StartdistC = hip;
            StartIndexC = n;
          } else {
            if (StartdistC > hip) {
              StartNumC = LINHA[i].id;
              latStartC = LINHA[i].latitude;
              lngStartC = LINHA[i].longitude;
              StartLinhaC = LINHA[i].linha;
              StartdistC = hip;
              StartIndexC = n;
            }
          }
        }
      }
      //Se algum ponto satisfez as condições ele é salvo no array como possivel ponto final da rota
      if (StartdistB !== -1) {
        StartPointB[StartPointB.length] = {
          linha: StartLinhaB,
          id: StartIndexB,
          num: StartNumB,
          latitude: latStartB,
          longitude: lngStartB,
          dist: StartdistB,
        };
      }
      if (StartdistC !== -1) {
        StartPointC[StartPointC.length] = {
          linha: StartLinhaC,
          id: StartIndexC,
          num: StartNumC,
          latitude: latStartC,
          longitude: lngStartC,
          dist: StartdistC,
        };
      }
      //Zera as variaveis para uma nova linha ser analisada
      StartdistB = -1;
      StartdistC = -1;
      //====== Laço For acaba aqui ===============
    }
    console.log('StopPointB: ', StopPointB, 'StopPointC', StopPointC);
    console.log('StartPointB: ', StartPointB, 'StartPointC', StartPointC);

    if (StopPointB.length === 0 && StopPointC.length === 0) {
      Alert.alert(
        'Alerta',
        'Não foram encontrados pontos de parada próximos ao destino selecionado',
        [
          {
            text: 'Ok',
            onPress: () => {},
          },
        ],
      );
    } else if (StartPointB.length === 0 && StartPointC.length === 0) {
      Alert.alert(
        'Alerta',
        'Não foram encontrados pontos de parada próximos à sua localização',
        [
          {
            text: 'Ok',
            onPress: () => {},
          },
        ],
      );
    } else if (StopPointB.length === 1 && StopPointB[0].id === -1) {
      //O destino esta a menos que 300 metros do terminal
      //Pegue a rota mais proxima para o centro
      if (StartPointC.length === 0) {
        Alert.alert(
          'Alerta',
          'Não foram encontrados pontos de parada sentido terminal próximos à sua localização',
          [
            {
              text: 'Ok',
              onPress: () => {},
            },
          ],
        );
      } else if (StartPointC.length === 1) {
        let Linha = LINHAS[StartIndexC];
        PointIn = StartPointC[0];
        PointOut = {
          linha: StartPointC[0].linha,
          id: StartPointC[0].id,
          num: LINHAS[StartPointC[0].id].length - 1,
          latitude:
            LINHAS[StartPointC[0].id][LINHAS[StartPointC[0].id].length - 1]
              .latitude,
          longitude:
            LINHAS[StartPointC[0].id][LINHAS[StartPointC[0].id].length - 1]
              .longitude,
          dist: 0.0009999,
        };
      } else {
        //Econtrar o ponto sentido centro mais proximo
        let Num;
        let memDist = -1;
        for (var j = 0; j < StartPointC.length; j++) {
          let Linha = StartPointC[j];
          if (memDist === -1) {
            memDist = Linha.dist;
            Id = Linha.id;
            Num = Linha.num;
          } else {
            if (memDist > Linha.dist) {
              memDist = Linha.dist;
              Id = Linha.id;
              Num = Linha.num;
            }
          }
        }
        let Linha = LINHAS[Id];
        PointIn = {
          linha: Linha[Num - 1].linha,
          id: Id,
          num: Num,
          latitude: Linha[Num - 1].latitude,
          longitude: Linha[Num - 1].longitude,
          dist: memDist,
        };
        PointOut = {
          linha: Linha[Num - 1].linha,
          id: Id,
          num: Linha.length,
          latitude: Linha[Linha.length - 1].latitude,
          longitude: Linha[Linha.length - 1].longitude,
          dist: 0.0009999,
        };
      }
      console.log(
        'Descer no terminal, PointIn: ',
        PointIn,
        ' PointOut: ',
        PointOut,
      );
    } else {
      //Procurar linhas iguais sentido centro para não ir para o terminal
      for (var k = 0; k < StartPointC.length; k++) {
        for (var l = 0; l < StopPointC.length; l++) {
          if (StartPointC[k].linha === StopPointC[l].linha) {
            if (StartPointC[k].num < StopPointC[l].num) {
              PointIn = StartPointC[k];
              PointOut = StopPointC[l];
            }
          }
        }
      }
      //Procurar linhas iguais sentido bairro para não ir para o terminal
      for (var k = 0; k < StartPointB.length; k++) {
        for (var l = 0; l < StopPointB.length; l++) {
          if (StartPointB[k].linha === StopPointB[l].linha) {
            if (StartPointB[k].num < StopPointB[l].num) {
              PointIn = StartPointB[k];
              PointOut = StopPointB[l];
            }
          }
        }
      }
      console.log('PONTOS NA MESMA LINHA?');
      console.log('PointIn: ', PointIn, 'PointOut: ', PointOut);
      //Se não achou rotas na mesma linha, IR PARA O TERMINAL
      if (PointOut === null && PointIn === null) {
        console.log('SEM PONTOS NA MESMA LINHA, VÁ PARA O TERMINAL');
        if (StartPointC.length === 0) {
          Alert.alert(
            'Alerta',
            'Não foram encontrados pontos de parada apróximos à sua localização atual',
            [
              {
                text: 'Ok',
                onPress: () => {},
              },
            ],
          );
        } else if (StopPointB.length === 0) {
          if (StopPointC.length === 0) {
            Alert.alert(
              'Alerta',
              'Não foram encontrados pontos de parada apróximos à sua localização atual',
              [
                {
                  text: 'Ok',
                  onPress: () => {},
                },
              ],
            );
          } else {
            //O usuario deverá permanecer no onibus até que ele mude o sentido de bairro para centro
            //Start deverá ser em direção ao centro
            let Num;
            let memDist = -1;
            for (var j = 0; j < StartPointC.length; j++) {
              let Linha = StartPointC[j];
              if (memDist === -1) {
                memDist = Linha.dist;
                Id = Linha.id;
                Num = Linha.num;
              } else {
                if (memDist > Linha.dist) {
                  memDist = Linha.dist;
                  Id = Linha.id;
                  Num = Linha.num;
                }
              }
            }
            let Linha = LINHAS[Id];
            PointIn = {
              linha: Linha[Num - 1].linha,
              id: Id,
              num: Num,
              latitude: Linha[Num - 1].latitude,
              longitude: Linha[Num - 1].longitude,
              dist: memDist,
            };
            //Stop deverá ser em direção ao centro
            let Num2;
            let memDist2 = -1;
            for (var j = 0; j < StopPointC.length; j++) {
              let Linha2 = StopPointC[j];
              if (memDist2 === -1) {
                memDist2 = Linha2.dist;
                Id2 = Linha2.id;
                Num2 = Linha2.num;
              } else {
                if (memDist2 > Linha2.dist) {
                  memDist2 = Linha2.dist;
                  Id2 = Linha2.id;
                  Num2 = Linha2.num;
                }
              }
            }
            let Linha2 = LINHAS[Id2];
            PointOut = {
              linha: Linha2[Num2 - 1].linha,
              id: Id2,
              num: Num2,
              latitude: Linha2[Num2 - 1].latitude,
              longitude: Linha2[Num2 - 1].longitude,
              dist: memDist2,
            };
            console.log(
              'Espere no onibus ate que ele troque de rota, PointIn: ',
              PointIn,
              ' PointOut: ',
              PointOut,
            );
          }
        } else {
          //Start deverá ser em direção ao centro
          let Num;
          let memDist = -1;
          for (var j = 0; j < StartPointC.length; j++) {
            let Linha = StartPointC[j];
            if (memDist === -1) {
              memDist = Linha.dist;
              Id = Linha.id;
              Num = Linha.num;
            } else {
              if (memDist > Linha.dist) {
                memDist = Linha.dist;
                Id = Linha.id;
                Num = Linha.num;
              }
            }
          }
          let Linha = LINHAS[Id];
          PointIn = {
            linha: Linha[Num - 1].linha,
            id: Id,
            num: Num,
            latitude: Linha[Num - 1].latitude,
            longitude: Linha[Num - 1].longitude,
            dist: memDist,
          };
          //Stop deverá ser em direção ao bairro
          let Num2;
          let memDist2 = -1;
          console.log('===============', StopPointB);
          for (var j = 0; j < StopPointB.length; j++) {
            let Linha2 = StopPointB[j];
            if (memDist2 === -1) {
              memDist2 = Linha2.dist;
              Id2 = Linha2.id;
              Num2 = Linha2.num;
            } else {
              if (memDist2 > Linha2.dist) {
                memDist2 = Linha2.dist;
                Id2 = Linha2.id;
                Num2 = Linha2.num;
              }
            }
          }
          let Linha2 = LINHAS[Id2];
          PointOut = {
            linha: Linha2[Num2 - 1].linha,
            id: Id2,
            num: Num2,
            latitude: Linha2[Num2 - 1].latitude,
            longitude: Linha2[Num2 - 1].longitude,
            dist: memDist2,
          };
          console.log(
            'Ir para o terminal e trocar de onibus, PointIn: ',
            PointIn,
            ' PointOut: ',
            PointOut,
          );
        }
      }
    }

    //Se houver pointIn e PointOut ==================================
    if (PointIn !== null && PointOut !== null) {
      console.log('Fim da função: ', PointIn, PointOut);
      this.mqttChannel(PointIn, PointOut);
      if (PointIn.linha === PointOut.linha) {
        //Se os pontos forem da mesma linha
        //Basta cortar a linha do  ponto de start ao ponto stop
        WayPointsBS = LINHAS[PointIn.id].slice(
          PointIn.num - 1,
          PointOut.num - 1,
        );
      } else if (PointOut.linha.slice(0, 1) === 'C') {
        let BfSt = LINHAS[Id];
        let AfSt1 = LINHAS[Id2 - 1];
        let AfSt2 = LINHAS[Id2];
        //AfSt1.concat(AfSt2.slice(0, PointOut.num))
        WayPointsBS = BfSt.slice(PointIn.num - 1);
        WayPointsAS = AfSt1.concat(AfSt2.slice(0, PointOut.num));
      } else {
        let BfSt = LINHAS[Id];
        let AfSt = LINHAS[Id2];
        WayPointsBS = BfSt.slice(PointIn.num - 1);
        WayPointsAS = AfSt.slice(0, PointOut.num);
      }

      this.setState({
        HasRoute: true,
        WayPointsBS: WayPointsBS,
        WayPointsAS: WayPointsAS,
        StartPoint: {latitude: PointIn.latitude, longitude: PointIn.longitude},
        StopPoint: {latitude: PointOut.latitude, longitude: PointOut.longitude},
        PointIn: PointIn,
        PointOut: PointOut,
      });
    }
    console.log(
      'Points Ok',
      WayPointsAS,
      WayPointsBS,
      this.state.HasRoute, // Se houver pointin e pointout
      this.state.StartPoint,
      this.state.StopPoint,
    );
  }

  mqttChannel(In, Out) {
    console.log('Channel:', In.linha, Out.linha);
    let idLine1 = -1;
    let idLine2 = -1;
    for (var n = 0; n < LINHAS.length; n++) {
      let linha = LINHAS[n];
      for (var i = 0; i < linha.length; i++) {
        let line = linha[i];
        if (In.linha === line.linha) {
          idLine1 = n;
        }
        if (Out.linha === line.linha) {
          idLine2 = n;
        }
      }
    }

    let linhas = [In.linha, Out.linha];
    this.mqttConnect.unsubscribeChannel(this.state.channel);
    let newchannel = 'B-' + linhas[0];
    this.mqttConnect.subscribeChannel(newchannel);
    this.setState({
      linhas: linhas,
      channel: newchannel,
      idLine1: idLine1,
      idLine2: idLine2,
    });
    console.log('IDLINE================', idLine1, idLine2);
  }

  findCoordinates(destination) {
    console.log('FindCoords');
    Geolocation.getCurrentPosition(
      (data) => {
        let location = {
          latitude: data.coords.latitude,
          longitude: data.coords.longitude,
        };
        this.setState({
          location: location,
        });
        if (destination != null) {
          this.GetPoints(destination, location);
        }
        console.log('Local Ok: ', this.state.location);
      },
      (error) => {
        console.log('Find Coordinates: ', error);
        this.GpsIsOff();
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 10000,
        distanceFilter: 30,
      },
    );
  }
  //======================================================================================
  getDestino = async () => {
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
        let response = await fetch(ApiUrl + 'destino/' + this.state.id, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 5000,
          body: JSON.stringify({
            token: this.state.token,
          }),
        });
        let responseJson = await response.json();

        let destination = {
          latitude: parseFloat(responseJson.destino.latitude),
          longitude: parseFloat(responseJson.destino.longitude),
          latitudeDelta: 0.00143,
          longitudeDelta: 0.0134,
        };
        this.setState({
          dest_title: responseJson.destino.title,
          destination: destination,
        });
        this.findCoordinates(destination);
        console.log('Destino Ok: ', this.state.destination);
        return responseJson.data;
      } catch (error) {
        Alert.alert('Erro', 'Dados invalidos na requisição', [
          {
            text: 'Ok',
            onPress: () => {
              this.mqttConnect.unsubscribeChannel(this.state.channel);
              this.props.navigation.navigate('HomeApp');
            },
          },
        ]);
      }
    } catch (e) {
      Alert.alert('Erro', 'Erro ao traçar a rota', [
        {
          text: 'Ok',
          onPress: () => {
            this.mqttConnect.unsubscribeChannel(this.state.channel);
            this.props.navigation.navigate('HomeApp');
          },
        },
      ]);
    }
  };

  GpsIsOff = async () => {
    RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
      interval: 10000,
      fastInterval: 5000,
    })
      .then((data) => {
        //console.log(data);
      })
      .catch((err) => {
        this.GpsIsOff();
        console.log(err);
      });
  };

  bus_location(request) {
    if (this.state.PointIn.num != null) {
      console.log('Nova mensagem!!!', request);
      //Ex: '{"Point_Now": 1, "Location": {"latitude": -21.194935, "longitude": -50.452241}, "RequestOk": []}'
      let json = JSON.parse(request);
      //console.log(json);
      let Location = json.Location;
      if (this.state.PointIn.num < json.Point_Now) {
        this.setState({NoBus: true});
      }
      this.setState({
        bus_point: json.Point_Now,
        bus_coordinate: {
          latitude: Location.latitude,
          longitude: Location.longitude,
        },
      });
    }
  }

  async componentDidMount() {
    await this.GetData();

    Geocoder.init('AIzaSyDJANTANzQey3Qe8yBpjbskbyH7KnuOqws');
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
      //console.log('Message arrived: ', message);
      //console.log('Payload: ', message.payloadString);
      this.bus_location(message.payloadString);
    };
    this.mqttConnect.onMQTTMessageDelivered = (message) => {
      //console.log('Message delivered: ', message);
    };

    return () => {
      this.mqttConnect.close();
    };
  }

  async setData() {
    let PointIn = this.state.PointIn;
    let PointOut = this.state.PointOut;
    let idLine1 = PointIn.id;
    let idLine2 = PointOut.id;
    let destino = this.state.destination;
    let dados =
      '{"idStart": ' +
      PointIn.num +
      ', "idStop": ' +
      PointOut.num +
      ', "idLinha1": ' +
      idLine1 +
      ', "idLinha2": ' +
      idLine2 +
      ', "destination": { "latitude": ' +
      destino.latitude +
      ', "longitude": ' +
      destino.longitude +
      '}}';
    console.log('====================================');
    console.log(dados);
    console.log('====================================');
    try {
      await AsyncStorage.setItem('onTravel', 'true');
    } catch (e) {
      // saving error
    }
    try {
      await AsyncStorage.multiSet([
        ['dados', dados],
        ['channel', this.state.channel],
      ]);
      this.mqttConnect.unsubscribeChannel(this.state.channel);
      this.props.navigation.navigate('MapScreen');
      //this.props.navigation.navigate('TestMapScreen');
    } catch (error) {
      console.log(error);
    }
  }

  render() {
    const {
      location,
      destination,
      StartPoint,
      StopPoint,
      WayPointsBS,
      WayPointsAS,
    } = this.state;
    return (
      <SafeAreaView
        style={{height: '100%', alignItems: 'center', backgroundColor: '#fff'}}>
        <View
          style={{
            width: '100%',
            backgroundColor: '#FF8000',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessible={false}
          //accessibilityLabel="Painel de informações"
          //accessibilityHint="Insira o destino e deslize para a direita para selecionar uma sugestão"
        >
          <Text
            accessibilityLiveRegion="polite"
            style={{
              fontSize: 18,
              paddingTop: 5,
              color: '#fff',
              fontWeight: 'bold',
            }}>
            Destino: {this.state.dest_title}
          </Text>
          {this.state.Bus_inf && (
            <Text
              accessibilityLiveRegion="assertive"
              style={{
                padding: 5,
                paddingTop: 0,
                color: 'white',
                fontSize: 14,
                fontWeight: 'bold',
              }}>
              Próximo onibus em {this.state.Bus_inf.duration}
            </Text>
          )}
          {!this.state.Bus_inf && (
            <Text
              accessibilityLiveRegion="assertive"
              style={{
                padding: 5,
                paddingTop: 0,
                color: 'white',
                fontSize: 14,
                fontWeight: 'bold',
              }}>
              Aguardando localização do onibus
            </Text>
          )}
        </View>
        <View
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          style={{flex: 1, height: '50%', width: '100%'}}>
          <MapView
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            initialRegion={this.state.region}
            style={styles.MapView}
            //rotateEnabled={false}
            //scrollEnabled={false}
            //zoomEnabled={false}
            pitchEnabled={false}
            showsPointsOfInterest={false}
            showsBuildings={false}
            showsUserLocation={false}
            loadingEnabled={false}
            onMapReady={async () => {
              console.log('Mapa: OK');
              await this.getDestino();
            }}
            ref={(el) => (this.MapView = el)}>
            {WayPointsAS && WayPointsBS && (
              //Rota completa, ela é invisivel =====================
              <Directions
                width={0}
                color="#f0f"
                mode="DRIVING"
                origin={StartPoint}
                destination={StopPoint}
                waypoints={WayPointsBS.concat(WayPointsAS)}
                onError={(error) => {
                  console.log('StartStop', error);
                }}
                onReady={(result) => {
                  this.MapView.fitToCoordinates(result.coordinates, {
                    edgePadding: {right: 50, left: 50, top: 50, bottom: 50},
                  });
                }}
              />
            )}
            {!WayPointsAS && WayPointsBS && (
              //Rota completa, ela é invisivel =====================
              <Directions
                width={0}
                color="#f0f"
                mode="DRIVING"
                origin={StartPoint}
                destination={StopPoint}
                waypoints={WayPointsBS}
                onError={(error) => {
                  console.log('StartStop', error);
                }}
                onReady={(result) => {
                  this.MapView.fitToCoordinates(result.coordinates, {
                    edgePadding: {right: 50, left: 50, top: 50, bottom: 50},
                  });
                }}
              />
            )}
            {WayPointsAS && (
              //Rota do onibus antes do terminal =====================
              <Directions
                width={3}
                color="#FF8000"
                mode="DRIVING"
                origin={WayPointsBS[0]}
                destination={WayPointsBS[WayPointsBS.length - 1]}
                waypoints={WayPointsBS}
                onError={(error) => {
                  console.log('StartStop', error);
                }}
                onReady={(result) => {
                  console.log('AS: ', result.duration);
                  let duration;
                  let decimal;
                  let s;
                  let m = Math.trunc(result.duration);
                  if (m === 0) {
                    Alert.alert('Alerta', 'Erro na rota', [
                      {
                        text: 'Ok',
                        onPress: () => {},
                      },
                    ]);
                  } else {
                    decimal = result.duration % m;
                    s = decimal * 60;
                    // ao menos 1 minuto
                    if (s < 30) {
                      duration = m;
                    } else {
                      duration = m + 1;
                    }
                  }
                  this.setState({
                    duration: this.state.duration + duration,
                  });
                }}
              />
            )}
            {WayPointsAS && (
              //Rota do onibus depois do terminal =====================
              <Directions
                width={3}
                color="#FF8000"
                mode="DRIVING"
                origin={WayPointsAS[0]}
                destination={WayPointsAS[WayPointsAS.length - 1]}
                waypoints={WayPointsAS}
                onError={(error) => {
                  console.log('StartStop', error);
                }}
                onReady={(result) => {
                  console.log('BS: ', result.duration);
                  let duration;
                  let decimal;
                  let s;
                  let m = Math.trunc(result.duration);
                  if (m === 0) {
                    Alert.alert('Alerta', 'Erro na rota', [
                      {
                        text: 'Ok',
                        onPress: () => {
                          if (this.state.channel !== null) {
                            this.mqttConnect.unsubscribeChannel(
                              this.state.channel,
                            );
                          }
                          this.props.navigation.goBack();
                        },
                      },
                    ]);
                  } else {
                    decimal = result.duration % m;
                    s = decimal * 60;
                    // ao menos 1 minuto
                    if (s < 30) {
                      duration = m;
                    } else {
                      duration = m + 1;
                    }
                  }
                  this.setState({
                    duration: this.state.duration + duration,
                  });
                }}
              />
            )}
            {!WayPointsAS && WayPointsBS && (
              //Rota do usuario depois de descer do onibus =====================
              <Directions
                width={3}
                color="#FF8000"
                mode="DRIVING"
                origin={StartPoint}
                destination={StopPoint}
                waypoints={WayPointsBS}
                onError={(error) => {
                  console.log('StartStop', error);
                }}
                onReady={(result) => {
                  console.log('AS: ', result.duration);
                  let duration;
                  let decimal;
                  let s;
                  let m = Math.trunc(result.duration);
                  if (m === 0) {
                    Alert.alert('Alerta', 'Erro na rota', [
                      {
                        text: 'Ok',
                        onPress: () => {
                          this.mqttConnect.unsubscribeChannel(
                            this.state.channel,
                          );
                          this.props.navigation.goBack();
                        },
                      },
                    ]);
                  } else {
                    decimal = result.duration % m;
                    s = decimal * 60;
                    // ao menos 1 minuto
                    if (s < 30) {
                      duration = m;
                    } else {
                      duration = m + 1;
                    }
                  }
                  this.setState({
                    duration: this.state.duration + duration,
                  });
                }}
              />
            )}
            {this.state.HasRoute && (
              //Rota do usuario antes de subir no onibus =====================
              <Directions
                width={1}
                color="#000"
                mode="WALKING"
                origin={location}
                destination={StartPoint}
                onError={(error) => {
                  console.log('StartStop', error);
                }}
                onReady={async (result) => {
                  let title = null;
                  await Geocoder.from(StartPoint.latitude, StartPoint.longitude)
                    .then((json) => {
                      var addressComponent = json.results[0].address_components;
                      title =
                        addressComponent[1].short_name +
                        ' , ' +
                        addressComponent[0].short_name +
                        ' - ' +
                        addressComponent[2].short_name;
                    })
                    .catch((error) => console.warn(error));

                  /*console.log(
                  'Tempo até o ponto: ',
                  title,
                  result.duration,
                  result.distance,
                );*/
                  let duration;
                  let decimal;
                  let s;
                  let m = Math.trunc(result.duration);
                  if (m === 0) {
                    //menos de um minuto
                    decimal = result.duration;
                    s = decimal * 60;
                    duration = s.toFixed(0) + ' segundos';
                  } else {
                    decimal = result.duration % m;
                    s = decimal * 60;
                    // ao menos 1 minuto
                    if (s < 30) {
                      if (m === 1) {
                        duration = m + ' minuto';
                      } else {
                        duration = m + ' minutos';
                      }
                    } else {
                      duration = m + 1 + ' minutos';
                    }
                  }
                  let distance = result.distance * 1000;
                  if (
                    LINHAS[this.state.PointIn.id][0].linha.slice(0, 1) ===
                      'B' &&
                    this.state.PointIn.num === 1
                  ) {
                    this.setState({
                      PointIn_inf: {
                        title: 'Terminal',
                        distance: distance,
                        duration: duration,
                      },
                    });
                  } else {
                    this.setState({
                      PointIn_inf: {
                        title: title,
                        distance: distance,
                        duration: duration,
                      },
                    });
                  }
                  this.setState({durationUser_Pnt: m});
                }}
              />
            )}
            {this.state.HasRoute && this.state.PointOut && (
              <Directions
                width={1}
                color="#000"
                mode="WALKING"
                origin={StopPoint}
                destination={destination}
                onError={(error) => {
                  console.log('StartStop', error);
                }}
                onReady={async (result) => {
                  let title = null;
                  await Geocoder.from(StopPoint.latitude, StopPoint.longitude)
                    .then((json) => {
                      var addressComponent = json.results[0].address_components;
                      title =
                        addressComponent[1].short_name +
                        ' , ' +
                        addressComponent[0].short_name +
                        ' - ' +
                        addressComponent[2].short_name;
                    })
                    .catch((error) => console.warn(error));

                  console.log(
                    'Tempo até o destino: ',
                    title,
                    result.duration,
                    result.distance,
                  );
                  let duration;
                  let decimal;
                  let s;
                  let m = Math.trunc(result.duration);
                  if (m === 0) {
                    //menos de um minuto
                    decimal = result.duration;
                    s = decimal * 60;
                    duration = s.toFixed(0) + ' segundos';
                  } else {
                    decimal = result.duration % m;
                    s = decimal * 60;
                    // ao menos 1 minuto
                    if (s < 30) {
                      if (m === 1) {
                        duration = m + ' minuto';
                      } else {
                        duration = m + ' minutos';
                      }
                    } else {
                      duration = m + 1 + ' minutos';
                    }
                  }
                  let distance = result.distance * 1000;
                  let PointOut = this.state.PointOut;

                  if (PointOut.num === LINHAS[PointOut.id].length - 1) {
                    this.setState({
                      duration: this.state.duration + m,
                      PointOut_inf: {
                        title: 'Terminal',
                        distance: distance,
                        duration: duration,
                      },
                    });
                  } else {
                    this.setState({
                      duration: this.state.duration + m,
                      PointOut_inf: {
                        title: title,
                        distance: distance,
                        duration: duration,
                      },
                    });
                  }
                }}
              />
            )}
            {this.state.bus_coordinate && (
              //Rota do onibus até o ponto =====================
              <Directions
                width={0}
                color="#f0f"
                mode="DRIVING"
                origin={this.state.bus_coordinate}
                destination={
                  LINHAS[this.state.idLine1][this.state.PointIn.num - 1]
                }
                waypoints={LINHAS[this.state.idLine1].slice(
                  this.state.bus_point,
                  this.state.PointIn.num,
                )}
                onError={(error) => {
                  console.log('StartStop', error);
                }}
                onReady={(result) => {
                  console.log(
                    'Tempo até o Onibus: ',
                    result.duration,
                    result.distance,
                    'Point',
                    this.state.bus_point,
                    'Coord',
                    this.state.bus_coordinate,
                    this.state.idLine1,
                    this.state.PointIn.num,
                  );
                  let distance = result.distance * 1000;
                  let duration;
                  let decimal;
                  let s;
                  let m = Math.trunc(result.duration);
                  if (m === 0) {
                    //menos de um minuto
                    decimal = result.duration;
                    s = decimal * 60;
                    duration = s.toFixed(0) + ' segundos';
                  } else {
                    decimal = result.duration % m;
                    s = decimal * 60;
                    // ao menos 1 minuto
                    if (s < 30) {
                      if (m === 1) {
                        duration = m + ' minuto';
                      } else {
                        duration = m + ' minutos';
                      }
                    } else {
                      duration = m + 1 + ' minutos';
                    }
                  }
                  if (this.state.NoBus) {
                    let buspast = 50 - m;
                    this.setState({
                      durationBus_Pnt: m,
                      Bus_inf: {
                        distance: distance,
                        duration: buspast + ' minutos',
                      },
                    });
                  } else {
                    this.setState({
                      durationBus_Pnt: m,
                      Bus_inf: {
                        distance: distance,
                        duration: duration,
                      },
                    });
                  }
                }}
              />
            )}
            <Marker
              accessible={false}
              coordinate={TerminalCentro}
              anchor={{x: 0.5, y: 1}}
              image={IMAGE.STOP}
            />

            {this.state.bus_coordinate && (
              <Marker
                accessible={false}
                coordinate={this.state.bus_coordinate}
                anchor={{x: 0.5, y: 1}}
                image={IMAGE.BUS}
              />
            )}
            {destination && (
              <Marker
                accessible={false}
                coordinate={destination}
                anchor={{x: 0.5, y: 1}}
                image={IMAGE.MARKER}
              />
            )}
            {location && (
              <Marker
                accessible={false}
                coordinate={location}
                anchor={{x: 0.5, y: 1}}
                image={IMAGE.MARKER}
              />
            )}
          </MapView>
        </View>
        {!this.state.PointIn_inf && (
          <View
            accessible={true}
            style={{
              backgroundColor: '#fff',
              width: '100%',
              height: '30%',
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text
              accessibilityLiveRegion="assertive"
              style={{color: 'gray', fontSize: 22}}>
              Carregando . . .
            </Text>
          </View>
        )}
        {this.state.PointIn_inf && (
          <View
            accessible={true}
            accessibilityLabel="Painel de informações"
            accessibilityHint="Roteiro do itinerário"
            style={{
              borderRadius: 15,
              padding: 6,
              backgroundColor: '#FFf',
              width: '98%',
              //height: '32%',
              //position: 'absolute',
              bottom: 0,
              justifyContent: 'center',
              //alignItems: 'center',
              borderWidth: 1,
            }}>
            <View style={{alignItems: 'center'}} accessible={true}>
              <Text
                accessibilityLiveRegion="assertive"
                style={{
                  //padding: 5,
                  color: '#FF8000',
                  fontSize: 18,
                  fontWeight: 'bold',
                }}>
                ITINERÁRIO - {this.state.duration} minutos
              </Text>
            </View>
            <View accessible={true}>
              <Text
                accessible={true}
                style={{
                  paddingTop: 5,
                  color: 'black',
                  fontSize: 14,
                  fontWeight: 'bold',
                }}>
                - Embarque: {this.state.PointIn_inf.title}
              </Text>
              {this.state.PointIn && (
                <View accessible={true}>
                  <Text
                    accessible={true}
                    style={{
                      paddingTop: 5,
                      color: 'black',
                      fontSize: 14,
                      fontWeight: 'bold',
                    }}>
                    - Pegue a linha: {NomeLinhas[this.state.PointIn.id]}
                  </Text>
                </View>
              )}
              {this.state.WayPointsAS && (
                <View accessible={true}>
                  <Text
                    accessible={true}
                    style={{
                      paddingTop: 5,
                      color: 'black',
                      fontSize: 14,
                      fontWeight: 'bold',
                    }}>
                    - Siga até o terminal
                  </Text>
                  <Text
                    accessible={true}
                    style={{
                      paddingTop: 5,
                      color: 'black',
                      fontSize: 14,
                      fontWeight: 'bold',
                    }}>
                    - Pegue a linha: {NomeLinhas[this.state.PointOut.id]}
                  </Text>
                </View>
              )}
              {this.state.PointOut_inf && (
                <View accessible={true}>
                  <Text
                    accessible={true}
                    style={{
                      paddingTop: 5,
                      color: 'black',
                      fontSize: 14,
                      fontWeight: 'bold',
                    }}>
                    - Desembarque: {this.state.PointOut_inf.title}
                  </Text>
                </View>
              )}
            </View>
            <View
              style={{
                width: '100%',
                paddingTop: 5,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <TouchableOpacity
                accessibilityLabel="Botão"
                accessibilityHint="Iniciar Viagem"
                style={{
                  width: '60%',
                  height: 30,
                  backgroundColor: '#FF8000',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 20,
                  bottom: 3,
                }}
                onPress={async () => {
                  if (this.state.bus_coordinate) {
                    if (
                      this.state.durationBus_Pnt <= this.state.durationUser_Pnt
                    ) {
                      Alert.alert(
                        'AVISO',
                        'Você não chegará ao ponto a tempo!',
                        [
                          {
                            text: 'Ok',
                            onPress: () => {},
                          },
                        ],
                      );
                    } else {
                      Alert.alert(
                        'AVISO',
                        'O ônibus chegará ao ponto em ' +
                          this.state.durationBus_Pnt +
                          ' minuto(s). Não se atrase!',
                        [
                          {
                            text: 'Iniciar viagem',
                            onPress: async () => {
                              this.mqttConnect.unsubscribeChannel(
                                this.state.channel,
                              );
                              await this.setData();
                            },
                          },
                          {
                            text: 'Ir ao ponto com o Google Maps',
                            onPress: async () => {
                              let title = null;
                              await Geocoder.from(
                                this.state.StartPoint.latitude,
                                this.state.StartPoint.longitude,
                              )
                                .then((json) => {
                                  var addressComponent =
                                    json.results[0].address_components;
                                  title =
                                    addressComponent[1].short_name +
                                    ' , ' +
                                    addressComponent[0].short_name +
                                    ' - ' +
                                    addressComponent[2].short_name;
                                })
                                .catch((error) => console.warn(error));

                              openMap({end: title, travelType: 'walk'});
                              this.mqttConnect.unsubscribeChannel(
                                this.state.channel,
                              );
                              await this.setData();
                              try {
                                await AsyncStorage.setItem([
                                  'onTravel',
                                  'true',
                                ]);
                                this.props.navigation.navigate('HomeApp');
                              } catch (error) {
                                console.log(error);
                              }
                            },
                          },
                        ],
                      );
                    }
                  } else {
                    Alert.alert(
                      'Alerta',
                      'Aguardando a localização do ônibus',
                      [
                        {
                          text: 'OK',
                          onPress: async () => {
                            this.mqttConnect.unsubscribeChannel(
                              this.state.channel,
                            );
                            await this.setData();
                          },
                        },
                      ],
                    );
                  }
                  console.log(
                    this.state.location,
                    'tempo onibus: ',
                    this.state.durationBus_Pnt,
                    'tempo user: ',
                    this.state.durationUser_Pnt,
                  );
                }}>
                <Text
                  style={{color: 'white', fontSize: 18, fontWeight: 'bold'}}>
                  Ok
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
    height: '50%',
  },
});
