import React, {Component} from 'react';
import {Text, View, FlatList} from 'react-native';
import RNBluetoothClassic, {
  BTDevice,
  BTEvents,
} from 'react-native-bluetooth-classic';
import {Container, Header, Title} from 'native-base';
import {connect} from 'react-redux';

interface IProps {}

interface IState {
  receivedData: Array<any>;
  message: {
    eH: string;
    eT: string;
    iH: string;
    iT: string;
    m: number;
  };
}

class ConnectionScreen extends Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      receivedData: [],
      message: {
        eH: '',
        eT: '',
        iH: '',
        iT: '',
        m: 0,
      },
    };
  }

  onRead = {
    remove: () => {},
  };

  componentDidMount() {
    this.onRead = RNBluetoothClassic.addListener(
      BTEvents.READ,
      this.handleRead,
      this,
    );
    //this.poll = setInterval(() => this.pollForData(), 3000);
  }

  componentWillUnmount() {
    this.onRead.remove();
    //clearInterval(this.poll);

    RNBluetoothClassic.disconnect();
  }

  transformData(data: string) {
    let eH: string = 'error';
    let eT: string = 'error';
    let iH: string = 'error';
    let iT: string = 'error';

    try {
      const messageObject = JSON.parse(data);

      if (messageObject.external !== 'error') {
        eH = `${messageObject.external.H}%`;
        eT = `${messageObject.external.T}°С`;
      }

      if (messageObject.internal !== 'error') {
        iH = `${messageObject.internal.H}%`;
        iT = `${messageObject.internal.T}°С`;
      }

      return {eH, eT, iH, iT, m: messageObject.motor};
    } catch (error) {
      return false;
    }
  }

  pollForData = async () => {
    let available = false;

    do {
      console.log('Checking for available data');
      available = await RNBluetoothClassic.available();
      console.log(`There are ${available} bytes of data available`);

      if (available) {
        console.log('Attempting to read the next message from the device');
        const data = await RNBluetoothClassic.readFromDevice();

        console.log(data);
        this.handleRead({data});
      }
    } while (available);
  };

  handleRead = (data: any) => {
    const message = this.transformData(data.data);
    let receivedData = this.state.receivedData;

    if (message) {
      data.timestamp = new Date();
      receivedData.unshift(data);
      this.setState({receivedData, message});
    }
  };

  render() {
    return (
      <Container>
        <Header>
          <Title>{'Осушитель гаража подключен'}</Title>
        </Header>
        <View style={{flex: 1}}>
          <View style={viewStyle}>
            <Title style={{color: 'black'}}>
              {`Мотор ${this.state.message.m === 0 ? 'выключен' : 'включен'}`}
            </Title>
          </View>
          <View style={viewStyle}>
            <Title style={{alignContent: 'center', color: 'black'}}>
              {'Внутренний датчик'}
            </Title>
            <Title style={{color: 'black'}}>
              {`Влажность: ${this.state.message.iH}`}
            </Title>
            <Title style={{color: 'black'}}>
              {`Температура: ${this.state.message.iT}`}
            </Title>
          </View>
          <View style={viewStyle}>
            <Title style={{alignContent: 'center', color: 'black'}}>
              {'Внешний·датчик'}
            </Title>
            <Title style={{color: 'black'}}>
              {`Влажность: ${this.state.message.eH}`}
            </Title>
            <Title style={{color: 'black'}}>
              {`Температура: ${this.state.message.eT}`}
            </Title>
          </View>

          <FlatList
            style={{flex: 1}}
            contentContainerStyle={{justifyContent: 'flex-end'}}
            inverted
            ref="scannedDataList"
            data={this.state.receivedData}
            keyExtractor={(item) => item.timestamp.toISOString()}
            renderItem={({item}) => (
              <View
                style={{flexDirection: 'row', justifyContent: 'flex-start'}}>
                <Text>{item.timestamp.toLocaleTimeString()}</Text>
                <Text>{item.type === 'sent' ? ' < ' : ' > '}</Text>
                <Text style={{flexShrink: 1}}>{item.data.trim()}</Text>
              </View>
            )}
          />
        </View>
      </Container>
    );
  }
}

export default connect((state: {connectedDevice: BTDevice}) => ({
  connectedDevice: state.connectedDevice,
}))(ConnectionScreen);

const viewStyle = {
  padding: 18,
  borderBottomColor: 'black',
  borderBottomWidth: 1,
};
