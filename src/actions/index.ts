import {BTDevice} from 'react-native-bluetooth-classic';

export const SELECT_DEVICE = 'SELECT_DEVICE';

export const setConnectedDevice = (device: BTDevice) => ({
  type: SELECT_DEVICE,
  value: device,
});
