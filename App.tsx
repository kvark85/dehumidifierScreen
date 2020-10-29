import React, {Component} from 'react';
import {Provider, connect} from 'react-redux';
import {store} from './src/store';
import RNBluetoothClassic, {
  BTEvents,
  BTCharsets,
  BTDevice,
} from 'react-native-bluetooth-classic';
import {Root, Container, Toast, Header, Title} from 'native-base';
import {selectDevice} from './src/actions';

import ConnectionScreen from './src/Component/ConnectionScreen/ConnectionScreen';

const HUMIDITY_BLUETOOTH_NAME = 'HC-05';

const showMessage = (message: string) => {
  Toast.show({text: message, duration: 3000});
};

const {BLUETOOTH_DISCONNECTED, CONNECTION_LOST, ERROR} = BTEvents;

interface IProps {
  connectedDevice: BTDevice;
  selectDevice: any;
}

class App extends Component<IProps> {
  constructor(props: IProps) {
    super(props);
  }

  subs = [];

  componentDidMount() {
    this.initialize();
    // Re-initialize whenever a Bluetooth event occurs
    this.subs = [
      // @ts-ignore
      RNBluetoothClassic.addListener(
        BLUETOOTH_DISCONNECTED,
        (device: BTDevice) => this.onDisconnected(device),
        this,
      ),
      // @ts-ignore
      RNBluetoothClassic.addListener(
        CONNECTION_LOST,
        (error) => this.onConnectionLost(error),
        this,
      ),
      // @ts-ignore
      RNBluetoothClassic.addListener(
        ERROR,
        (error) => this.onError(error),
        this,
      ),
    ];
  }

  componentWillUnmount() {
    this.subs.forEach((sub: any) => sub.remove());
  }

  onDisconnected(device: BTDevice) {
    showMessage(`Humidity controller(${device.name}) was disconnected`);
    this.initialize();
  }

  onConnectionLost(error: {device: {name: string}}) {
    showMessage(
      `Connection to humidity controller (${error.device.name}) was lost`,
    );
    this.initialize();
  }

  onError(error: {message: string}) {
    showMessage(`${error.message}`);
    this.initialize();
  }

  async initialize() {
    this.props.selectDevice(null);

    if (await RNBluetoothClassic.isEnabled()) {
      await this.refreshDevices();
    } else {
      showMessage('Bluetooth is disabled');
    }
  }

  async refreshDevices() {
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
    }
  }

  async connectToDevice(device: BTDevice) {
    try {
      await RNBluetoothClassic.setEncoding(BTCharsets.ASCII);
      const connectedDevice = await RNBluetoothClassic.connect(device.id);
      this.props.selectDevice(connectedDevice);
    } catch (error) {
      setTimeout(() => this.refreshDevices(), 1000);
    }
  }

  render() {
    return (
      <>
        {this.props.connectedDevice ? (
          <ConnectionScreen></ConnectionScreen>
        ) : (
          <Container>
            <Header>
              <Title>Подключение...</Title>
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
  {selectDevice},
)(App);

export default () => (
  <Root>
    <Provider store={store}>
      <AppContainer></AppContainer>
    </Provider>
  </Root>
);
