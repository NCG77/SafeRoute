import { StyleSheet, Text, View } from 'react-native';

const MapDisplay = (props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        Map functionality is not available on web.
        Please use the mobile app for full map features.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
});

export default MapDisplay;
