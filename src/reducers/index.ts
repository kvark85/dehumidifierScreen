import {BTDevice} from 'react-native-bluetooth-classic';
import {SELECT_DEVICE} from '../actions';

interface State {
  connectedDevice: BTDevice | null;
}

const initialState: State = {
  connectedDevice: null,
};

export default (
  state: State = initialState,
  action: {type: string; value: BTDevice},
) => {
  switch (action.type) {
    case SELECT_DEVICE: {
      return {
        ...state,
        connectedDevice: action.value,
      };
    }
    default: {
      return state;
    }
  }
};
