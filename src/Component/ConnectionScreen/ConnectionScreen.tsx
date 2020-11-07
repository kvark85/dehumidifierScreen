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
    externalRelativeH: string;
    externalAbsoluteH: string;
    externalT: string;
    internalRelativeH: string;
    internalAbsoluteH: string;
    internalT: string;
    m: number;
  };
}

class ConnectionScreen extends Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      receivedData: [],
      message: {
        externalRelativeH: '',
        externalAbsoluteH: '',
        externalT: '',
        internalRelativeH: '',
        internalAbsoluteH: '',
        internalT: '',
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
    let externalRelativeH: string = 'error';
    let externalAbsoluteH: string = 'error';
    let externalT: string = 'error';
    let internalRelativeH: string = 'error';
    let internalAbsoluteH: string = 'error';
    let internalT: string = 'error';

    try {
      const messageObject = JSON.parse(data);

      if (messageObject.e !== 'error') {
        externalRelativeH = `${messageObject.e.rH}%`;
        externalAbsoluteH = `${messageObject.e.aH}г*м³`;
        externalT = `${messageObject.e.T}°С`;
      }

      if (messageObject.i !== 'error') {
        internalRelativeH = `${messageObject.i.rH}%`;
        internalAbsoluteH = `${messageObject.i.aH}г*м³`;
        internalT = `${messageObject.i.T}°С`;
      }

      return {
        externalRelativeH,
        externalAbsoluteH,
        externalT,
        internalRelativeH,
        internalAbsoluteH,
        internalT,
        m: messageObject.m,
      };
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
              {`Относительная влажност: ${this.state.message.internalRelativeH}`}
            </Title>
            <Title style={{color: 'black'}}>
              {`Абсолютная влажность: ${this.state.message.internalAbsoluteH}`}
            </Title>
            <Title style={{color: 'black'}}>
              {`Температура: ${this.state.message.internalT}`}
            </Title>
          </View>
          <View style={viewStyle}>
            <Title style={{alignContent: 'center', color: 'black'}}>
              {'Внешний·датчик'}
            </Title>
            <Title style={{color: 'black'}}>
              {`Относительная влажность: ${this.state.message.externalRelativeH}`}
            </Title>
            <Title style={{color: 'black'}}>
              {`Абсолютная влажность: ${this.state.message.externalAbsoluteH}`}
            </Title>
            <Title style={{color: 'black'}}>
              {`Температура: ${this.state.message.externalT}`}
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
