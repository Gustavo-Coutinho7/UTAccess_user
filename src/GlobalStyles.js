import {StyleSheet, Platform} from 'react-native';
export default StyleSheet.create({
  droidSafeArea: {
    flex: 1,
    backgroundColor: '#FF8000',
    paddingTop: Platform.OS === 'android' ? 15 : 0,
  },
});
