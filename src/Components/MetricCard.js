import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatPKR } from '../utils/currencyFormatter';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  label: { fontSize: 12, color: '#7F8C8D', marginBottom: 4, fontWeight: '600' },
  value: { fontSize: 18, fontWeight: 'bold' },
  subText: { fontSize: 10, color: '#BDC3C7', marginTop: 4 }
});

export const MetricCard = ({ label, value, color, subValue }) => (
  <View style={styles.card}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, { color }]}>{formatPKR(value || 0)}</Text>
    {subValue && <Text style={styles.subText}>{subValue}</Text>}
  </View>
);