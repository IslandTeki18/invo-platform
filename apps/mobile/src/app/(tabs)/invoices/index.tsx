import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/primitives/themed-text';

export default function InvoiceListScreen() {
  return (
    <View style={styles.container}>
      <ThemedText>Invoice List (placeholder)</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
