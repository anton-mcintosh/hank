import React from 'react';
import { StyleSheet, View } from 'react-native';
import ThemedText from './ThemedText';

export default function HelloWave() {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.text}>👋</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 8,
  },
  text: {
    fontSize: 28,
    lineHeight: 32,
    marginTop: -6,
  },
});
