import React, {Component} from 'react';
import {
  Text,
  View,
  SafeAreaView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Directions from '../Directions';
import MapView, {Marker} from 'react-native-maps';
import AsyncStorage from '@react-native-community/async-storage';
import Geolocation from '@react-native-community/geolocation';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';
import {IMAGE} from '../constants/Image';
import {LINHAS, TerminalChegada} from '../itinerario';
import {ApiUrl} from '../constants/ApiUrl';
import MQTTConnection from '../mqtt_conection/MQTTConnection';
import {Buffer} from 'buffer';
global.Buffer = Buffer;

export class HomeScreenDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
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
    };
  }
  bus_location(message) {
    let bus_location = JSON.parse(message);
    this.setState({
      bus_coordinate: {
        latitude: bus_location.latitude,
        longitude: bus_location.longitude,
      },
    });
  }

  mqttConect() {
    this.mqttConnect = new MQTTConnection();

    this.mqttConnect.connect('test.mosquitto.org', 8080);

    this.mqttConnect.onMQTTConnect = () => {
      console.log('Conmect');
      this.mqttConnect.subscribeChannel('UT_Access_Bus');
    };

    this.mqttConnect.onMQTTLost = () => {
      console.log('Lost Conmect');
    };

    this.mqttConnect.onMQTTMessageArrived = message => {
      //console.log('Message arrived: ', message);
      console.log('Message: ', message.payloadString);
      this.bus_location(message.payloadString);
    };

    this.mqttConnect.onMQTTMessageDelivered = message => {
      console.log('Message delivered: ', message);
    };

    return () => {
      this.mqttConnect.close();
    };
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
    for (var n = 0; n < LINHAS.length; n++) {
      let LINHA = LINHAS[n];
      //Percorrendo todos as linhas
      let ca_coTerminal =
        Math.pow(destination.latitude - TerminalChegada.latitude, 2) +
        Math.pow(destination.longitude - TerminalChegada.longitude, 2);
      let distTerminal = Math.pow(ca_coTerminal, 0.5);
      if (distTerminal < 0.003) {
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

          if (LINHA[i].linha.slice(0, 1) === 'B' && hip < 0.003) {
            //Se o ponto for sentido bairro e estiver a menos que 150 metros do destino
            if (StopdistB === -1) {
              StopNumB = LINHA[i].id;
              latStopB = LINHA[i].latitude;
              lngStopB = LINHA[i].longitude;
              StopLinhaB = LINHA[i].linha;
              StopdistB = hip;
              StopIndexB = n;
            } else {
              if (StopdistB > hip) {
                if (LINHA[i].id !== null) {
                  StopNumB = LINHA[i].id;
                  latStopB = LINHA[i].latitude;
                  lngStopB = LINHA[i].longitude;
                  StopLinhaB = LINHA[i].linha;
                  StopdistB = hip;
                  StopIndexB = n;
                }
              }
            }
          }

          if (LINHA[i].linha.slice(0, 1) === 'C' && hip < 0.003) {
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
                if (LINHA[i].id !== null) {
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
        }
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

      for (var i = 0; i < LINHA.length; i++) {
        //Percorrendo todos os pontos
        let ca_co =
          Math.pow(location.latitude - LINHA[i].latitude, 2) +
          Math.pow(location.longitude - LINHA[i].longitude, 2);
        let hip = Math.pow(ca_co, 0.5);
        if (LINHA[i].linha.slice(0, 1) === 'B' && hip < 0.003) {
          //Se o ponto for sentido bairro e estiver a menos que 150 metros do local atual
          if (StartdistB === -1) {
            StartNumB = LINHA[i].id;
            latStartB = LINHA[i].latitude;
            lngStartB = LINHA[i].longitude;
            StartLinhaB = LINHA[i].linha;
            StartdistB = hip;
            StartIndexB = n;
          } else {
            if (StartdistB > hip) {
              if (LINHA[i].id !== null) {
                StartNumB = LINHA[i].id;
                latStartB = LINHA[i].latitude;
                lngStartB = LINHA[i].longitude;
                StartLinhaB = LINHA[i].linha;
                StartdistB = hip;
                StartIndexB = n;
              }
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
              if (LINHA[i].id !== null) {
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
        'Não foram encontrados pontos de parada a menos de 300 metros do destino selecionado',
        [
          {
            text: 'Ok',
            onPress: () => {
              this.props.navigation.goBack();
            },
          },
        ],
      );
    } else if (StartPointB.length === 0 && StartPointC.length === 0) {
      Alert.alert(
        'Alerta',
        'Não foram encontrados pontos de parada a menos de 300 metros da sua localização',
        [
          {
            text: 'Ok',
            onPress: () => {
              this.props.navigation.goBack();
            },
          },
        ],
      );
    } else if (StopPointB.id === -1 && StopPointC.id === -1) {
      //O destino esta a menos que 300 metros do terminal
      //Pegue a rota mais proxima para o centro
      if (StartPointC.length === 0) {
        Alert.alert(
          'Alerta',
          'Não foram encontrados pontos de parada sentido terminal a menos de 300 metros da sua localização',
          [
            {
              text: 'Ok',
              onPress: () => {
                this.props.navigation.goBack();
              },
            },
          ],
        );
      } else if (StartPointC.length === 1) {
        let Linha = LINHAS[StartIndexC];
        PointIn = Linha[StartNumC - 1];
        PointOut = Linha[Linha.length - 1];
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
        PointIn = Linha[Num - 1];
        PointOut = Linha[Linha.length - 1];
      }
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
      console.log('PointIn: ', PointIn, 'PointOut: ', PointOut);
      //Se não achou rotas na mesma linha, IR PARA O TERMINAL
      if (PointOut === null && PointIn === null) {
        if (StartPointC.length === 0) {
          Alert.alert(
            'Alerta',
            'Não foram encontrados pontos de parada a menos de 300 metros da sua localização atual',
            [
              {
                text: 'Ok',
                onPress: () => {
                  this.props.navigation.goBack();
                },
              },
            ],
          );
        } else if (StopPointB.length === 0) {
          if (StopPointC.length === 0) {
            Alert.alert(
              'Alerta',
              'Não foram encontrados pontos de parada a menos de 300 metros da sua localização atual',
              [
                {
                  text: 'Ok',
                  onPress: () => {
                    this.props.navigation.goBack();
                  },
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
            PointIn = Linha[Num - 1];
            //Stop deverá ser em direção ao bairro
            let Num2;
            let memDist2 = -1;
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
            PointOut = Linha2[Num2 - 1];
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
          PointIn = Linha[Num - 1];
          //Stop deverá ser em direção ao bairro
          let Num2;
          let memDist2 = -1;
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
          PointOut = Linha2[Num2 - 1];
          console.log('PointIn', PointIn, 'PointOut', PointOut);
        }
      }
    }

    if (PointIn !== null && PointOut !== null) {
      if (PointIn.linha === PointOut.linha) {
        //Se os pontos forem da mesma linha
        //Basta cortar a linha do  ponto de start ao ponto stop
        WayPointsBS = LINHAS[PointIn.id].slice(
          PointIn.num - 1,
          PointOut.num - 1,
        );
      } else {
        let BfSt = LINHAS[Id];
        let AfSt = LINHAS[Id2];
        WayPointsBS = BfSt.slice(PointIn.id - 1);
        WayPointsAS = AfSt.slice(0, PointOut.id);
      }

      this.setState({
        HasRoute: true,
        WayPointsBS: WayPointsBS,
        WayPointsAS: WayPointsAS,
        StartPoint: {latitude: PointIn.latitude, longitude: PointIn.longitude},
        StopPoint: {latitude: PointOut.latitude, longitude: PointOut.longitude},
      });
    }
    console.log(
      'Points Ok',
      this.state.HasRoute,
      this.state.StartPoint,
      this.state.StopPoint,
    );

    this.mqttConect();
  }
  //======================================================================================
  findCoordinates = async destination => {
    Geolocation.getCurrentPosition(
      data => {
        let location = {
          latitude: data.coords.latitude,
          longitude: data.coords.longitude,
          latitudeDelta: 0.00143,
          longitudeDelta: 0.0134,
        };
        this.setState({
          location: location,
        });
        console.log('Local Ok: ', this.state.location);
        this.GetPoints(destination, location);
      },
      error => {
        console.log('Find Coordinates: ', error);
      },
      {
        //enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
        distanceFilter: 3,
      },
    );
    /* Geolocation.watchPosition(
      data => {
        this.GpsIsOff();
        let location = {
          latitude: data.coords.latitude,
          longitude: data.coords.longitude,
          latitudeDelta: 0.00143,
          longitudeDelta: 0.0134,
        };
        this.setState({
          location: location,
        });
      },
      error => {
        console.log(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 5000,
        distanceFilter: 3,
      },
    );*/
  };

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
          timeout: 2000,
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
        console.log('Destino Ok: ', this.state.destination);
        this.findCoordinates(destination);
        return responseJson.data;
      } catch (error) {
        Alert.alert('Erro', 'Dados invalidos na requisição', [
          {
            text: 'Ok',
            onPress: () => {
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
      .then(data => {
        console.log(data);
      })
      .catch(err => {
        this.GpsIsOff();
        console.log(err);
      });
  };

  async componentDidMount() {}

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
            height: 50,
            backgroundColor: '#FF8000',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{fontSize: 18, color: '#fff', fontWeight: 'bold'}}>
            {this.state.dest_title}
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
          showsUserLocation
          loadingEnabled={false}
          onMapReady={async () => {
            console.log('Mapa: OK');
            await this.getDestino();
          }}
          ref={el => (this.MapView = el)}>
          {WayPointsAS && (
            <Directions
              width={0}
              color="#FF8000"
              mode="DRIVING"
              origin={StartPoint}
              destination={StopPoint}
              waypoints={WayPointsBS.concat(WayPointsAS)}
              onError={error => {
                console.log('StartStop', error);
              }}
              onReady={result => {
                console.log(result.duration);
                this.MapView.fitToCoordinates(result.coordinates, {
                  edgePadding: {right: 50, left: 50, top: 50, bottom: 50},
                });
              }}
            />
          )}
          {WayPointsAS && (
            <Directions
              width={3}
              color="#FF8000"
              mode="DRIVING"
              origin={WayPointsBS[0]}
              destination={WayPointsBS[WayPointsBS.length - 1]}
              waypoints={WayPointsBS}
              onError={error => {
                console.log('StartStop', error);
              }}
              onReady={result => {}}
            />
          )}
          {WayPointsAS && (
            <Directions
              width={3}
              color="#FF8000"
              mode="DRIVING"
              origin={WayPointsAS[0]}
              destination={WayPointsAS[WayPointsAS.length - 1]}
              waypoints={WayPointsAS}
              onError={error => {
                console.log('StartStop', error);
              }}
              onReady={result => {}}
            />
          )}
          {!WayPointsAS && (
            <Directions
              width={3}
              color="#FF8000"
              mode="DRIVING"
              origin={StartPoint}
              destination={StopPoint}
              waypoints={WayPointsBS}
              onError={error => {
                console.log('StartStop', error);
              }}
              onReady={result => {
                console.log(result.duration);
                this.MapView.fitToCoordinates(result.coordinates, {
                  edgePadding: {right: 50, left: 50, top: 50, bottom: 50},
                });
              }}
            />
          )}
          {this.state.HasRoute && (
            <Directions
              width={1}
              color="#000"
              mode="WALKING"
              origin={location}
              destination={StartPoint}
              onError={error => {
                console.log('StartStop', error);
              }}
              onReady={result => {
                console.log(result.duration);
              }}
            />
          )}
          {this.state.HasRoute && (
            <Directions
              width={1}
              color="#000"
              mode="WALKING"
              origin={StopPoint}
              destination={destination}
              onError={error => {
                console.log('StartStop', error);
              }}
              onReady={result => {
                console.log(result.duration);
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
          {destination && (
            <Marker
              coordinate={destination}
              anchor={{x: 0.5, y: 1}}
              image={IMAGE.MARKER}
            />
          )}
        </MapView>
        <TouchableOpacity
          style={{height: 50, backgroundColor: '#ff0'}}
          onPress={() => {
            this.props.navigation.goBack();
          }}>
          <Text>OK</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  MapView: {
    width: '100%',
    height: '90%',
  },
});
