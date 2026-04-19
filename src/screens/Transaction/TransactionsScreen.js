import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTransactions } from '../../hooks/useTransactions';
import { formatPKR } from '../../utils/currencyFormatter';
import { COLORS } from '../../constants/constants';

const FILTER_TYPES = ['all', 'sale', 'expense', 'receivable', 'payable'];

export default function TransactionsScreen() {
  const { transactions, loading, error, loadTransactions } = useTransactions();
  const [activeFilter, setActiveFilter] = useState('all');

  // Refresh transaction data whenever this screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('[History] 👁️ Screen focused, refreshing data...');
      loadTransactions();
    }, [loadTransactions])
  );

  const filteredData = activeFilter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === activeFilter);

  const renderItem = ({ item }) => (
    <View style={styles.txItem}>
      <View>
        <Text style={styles.txCategory}>{item.category}</Text>
        <Text style={styles.txDate}>{item.date}</Text>
      </View>
      <Text style={[styles.txAmount, { color: item.type === 'sale' ? COLORS.secondary : COLORS.danger }]}>
        {item.type === 'sale' || item.type === 'receivable' ? '+' : '-'} {formatPKR(item.amount)}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: 'red', marginBottom: 10 }}>Error loading transactions</Text>
        <Text style={{ color: '#999', fontSize: 12 }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
      <View style={styles.filterBar}>
        {FILTER_TYPES.map(type => (
          <TouchableOpacity 
            key={type} 
            onPress={() => setActiveFilter(type)}
            style={[styles.filterBtn, activeFilter === type && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, activeFilter === type && styles.filterTextActive]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {filteredData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={{ fontSize: 12, color: '#999', marginTop: 5 }}>Start by adding a transaction</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingHorizontal: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E3A5F', marginBottom: 20 },
  filterBar: { flexDirection: 'row', marginBottom: 20, flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, backgroundColor: '#E0E0E0', marginBottom: 5 },
  filterBtnActive: { backgroundColor: '#1E3A5F' },
  filterText: { fontSize: 12, color: '#666' },
  filterTextActive: { color: '#FFF' },
  txItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#FFF', borderRadius: 12, marginBottom: 10, elevation: 1 },
  txCategory: { fontWeight: 'bold', color: '#2C3E50' },
  txDate: { fontSize: 12, color: '#999' },
  txAmount: { fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center' }
});