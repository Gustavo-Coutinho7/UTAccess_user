import * as React from 'react';
import {Image} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {InitMapScreen} from './InitMapScreen';
import {MapScreen} from './MapScreen';
import {TestMapScreen} from './TestMapScreen';
import {TestInitMapScreen} from './TestInitMapScreen';

import {CustomHeader, CustomDrawerContent} from './src';
import {
  HomeScreen,
  HomeScreenDetail,
  SettingsScreen,
  SettingsScreenDetail,
} from './src/tab';
import {NotificationsScreen, Historico, Favoritos} from './src/drawer';
import {RegisterScreen, LoginScreen, LoadScreen} from './src/auth';
import {IMAGE} from './src/constants/Image';

const Tab = createBottomTabNavigator();

const navOptionHandler = () => ({
  headerShown: false,
});

const StackHome = createStackNavigator();

function HomeStack() {
  return (
    <StackHome.Navigator initialRouteName="Home">
      <StackHome.Screen
        name="Home"
        component={HomeScreen}
        options={navOptionHandler}
      />
      <StackHome.Screen
        name="HomeDetail"
        component={HomeScreenDetail}
        options={navOptionHandler}
      />
    </StackHome.Navigator>
  );
}

const StackSetting = createStackNavigator();
function SettingStack() {
  return (
    <StackSetting.Navigator initialRouteName="Home">
      <StackSetting.Screen
        name="Setting"
        component={SettingsScreen}
        options={navOptionHandler}
      />
      <StackSetting.Screen
        name="SettingDetail"
        component={SettingsScreenDetail}
        options={navOptionHandler}
      />
    </StackSetting.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;
          if (route.name === 'Início') {
            iconName = focused ? IMAGE.ICON_HOME : IMAGE.ICON_HOMEBLACK;
          } else if (route.name === 'Configurações') {
            iconName = focused ? IMAGE.ICON_SETTINGS : IMAGE.ICON_SETTINGSBLACK;
          }
          return (
            <Image
              source={iconName}
              style={{width: 20, height: 20}}
              resizeMode="contain"
            />
          );
        },
      })}
      tabBarOptions={{
        activeTintColor: 'gray',
        inactiveTintColor: 'black',
      }}>
      <Tab.Screen name="Início" component={HomeStack} />
      <Tab.Screen name="Configurações" component={SettingStack} />
    </Tab.Navigator>
  );
}

const Drawer = createDrawerNavigator();

function DrawerNavigator({navigation}) {
  return (
    <Drawer.Navigator
      initialRouteName="MenuTab"
      drawerContent={() => <CustomDrawerContent navigation={navigation} />}>
      <Drawer.Screen name="MenuTab" component={TabNavigator} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} />
      <Drawer.Screen name="Historico" component={Historico} />
      <Drawer.Screen name="Favoritos" component={Favoritos} />
    </Drawer.Navigator>
  );
}

const StackApp = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StackApp.Navigator initialRouteName="Load">
        <StackApp.Screen
          name="HomeApp"
          component={DrawerNavigator}
          options={navOptionHandler}
        />
        <StackApp.Screen
          name="Login"
          component={LoginScreen}
          options={navOptionHandler}
        />
        <StackApp.Screen
          name="Load"
          component={LoadScreen}
          options={navOptionHandler}
        />
        <StackApp.Screen
          name="Register"
          component={RegisterScreen}
          options={navOptionHandler}
        />
        <StackApp.Screen
          name="InitMapScreen"
          component={InitMapScreen}
          options={navOptionHandler}
        />
        <StackApp.Screen
          name="MapScreen"
          component={MapScreen}
          options={navOptionHandler}
        />
        <StackApp.Screen
          name="TestMapScreen"
          component={TestMapScreen}
          options={navOptionHandler}
        />
        <StackApp.Screen
          name="TestInitMapScreen"
          component={TestInitMapScreen}
          options={navOptionHandler}
        />
      </StackApp.Navigator>
    </NavigationContainer>
  );
}
