import React, {Component} from 'react';
import {Provider, connect} from 'react-redux';
import {store} from './src/store';
import RNBluetoothClassic, {
  BTEvents,
  BTCharsets,
  BTDevice,
} from 'react-native-bluetooth-classic';
import {
  Root,
  Container,
  Toast,
  Header,
  Title,
  Left,
  Right,
  Body,
} from 'native-base';
import {setConnectedDevice} from './src/actions';

import ConnectionScreen from './src/Component/ConnectionScreen/ConnectionScreen';

const HUMIDITY_BLUETOOTH_NAME = 'HC-05';

const showMessage = (message: string) => {
  Toast.show({text: message, duration: 3000});
};

const {BLUETOOTH_DISCONNECTED, CONNECTION_LOST, ERROR} = BTEvents;

interface IProps {
  connectedDevice: BTDevice;
  setConnectedDevice: any;
}

class App extends Component<IProps> {
  subs: Array<any> = [];

  componentDidMount() {
    // Re-initialize whenever a Bluetooth event occurs
    this.subs = [
      RNBluetoothClassic.addListener(
        BLUETOOTH_DISCONNECTED,
        (device: BTDevice) => this.onDisconnected(device),
        this,
      ),
      RNBluetoothClassic.addListener(
        CONNECTION_LOST,
        (error) => this.onConnectionLost(error),
        this,
      ),
      RNBluetoothClassic.addListener(
        ERROR,
        (error) => this.onError(error),
        this,
      ),
    ];
    this.refreshDevices();
  }

  componentWillUnmount() {
    this.subs.forEach((sub: any) => sub.remove());
  }

  onDisconnected(device: BTDevice) {
    showMessage(`Humidity controller(${device.name}) was disconnected`);
    this.refreshDevices();
  }

  onConnectionLost(error: {device: {name: string}}) {
    showMessage(
      `Connection to humidity controller (${error.device.name}) was lost`,
    );
    this.refreshDevices();
  }

  onError(error: {message: string}) {
    showMessage(`${error.message}`);
    this.refreshDevices();
  }

  async refreshDevices() {
    if (!(await RNBluetoothClassic.isEnabled())) {
      return;
    }
    this.props.setConnectedDevice(null);
    try {
      const devices = await RNBluetoothClassic.list();
      const humidityControllerBluetooth = devices.find(
        (device: BTDevice) => device.name === HUMIDITY_BLUETOOTH_NAME,
      );

      if (humidityControllerBluetooth) {
        await this.connectToDevice(humidityControllerBluetooth);
      }
    } catch (error) {
      console.error(error.message);
      setTimeout(() => this.refreshDevices(), 1000);
    }
  }

  async connectToDevice(device: BTDevice) {
    try {
      await RNBluetoothClassic.setEncoding(BTCharsets.ASCII);
      const connectedDevice = await RNBluetoothClassic.connect(device.id);
      this.props.setConnectedDevice(connectedDevice);
    } catch (error) {
      setTimeout(() => this.refreshDevices(), 1000);
    }
  }

  render() {
    return (
      <>
        {this.props.connectedDevice ? (
          <ConnectionScreen />
        ) : (
          <Container>
            <Header>
              <Left />
              <Body>
                <Title>{'Подключение...'}</Title>
              </Body>
              <Right />
            </Header>
          </Container>
        )}
      </>
    );
  }
}

const AppContainer = connect(
  (state: {connectedDevice: BTDevice}) => ({
    connectedDevice: state.connectedDevice,
  }),
  {setConnectedDevice},
)(App);

export default () => (
  <Root>
    <Provider store={store}>
      <AppContainer />
    </Provider>
  </Root>
);
