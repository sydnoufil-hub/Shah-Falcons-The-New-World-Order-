import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTransactions } from '../hooks/useTransactions';
import { formatPKR } from '../utils/currencyFormatter';
import { COLORS } from '../constants/constants';

export default function LedgerScreen() {
  const { receivables, payables, update, loading, loadTransactions } = useTransactions();
  const [activeTab, setActiveTab] = useState('receivable');

  // Refresh ledger data whenever this screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('[Ledger] 👁️ Screen focused, refreshing data...');
      loadTransactions();
    }, [loadTransactions])
  );

  const data = activeTab === 'receivable' ? receivables : payables;
  
  // Filter for pending/overdue only at display time
  const displayData = data.filter(t => t.status === 'pending' || t.status === 'overdue');

  const markAsPaid = async (item) => {
    // Logic to change status to 'completed'
    await update(item.id, { ...item, status: 'completed' });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabHeader}>
        <TouchableOpacity onPress={() => setActiveTab('receivable')} style={[styles.tab, activeTab === 'receivable' && styles.activeTab]}>
          <Text style={activeTab === 'receivable' ? styles.activeTabText : styles.tabText}>To Receive</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('payable')} style={[styles.tab, activeTab === 'payable' && styles.activeTab]}>
          <Text style={activeTab === 'payable' ? styles.activeTabText : styles.tabText}>To Pay</Text>
        </TouchableOpacity>
      </View>

      {displayData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {activeTab === 'receivable' ? 'No pending receivables' : 'No pending payables'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.ledgerCard}>
              <View>
                <Text style={styles.name}>{item.counterparty || 'Unnamed'}</Text>
                <Text style={styles.dueDate}>Due: {item.dueDate || 'Not set'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.amount, { color: activeTab === 'receivable' ? COLORS.secondary : COLORS.danger }]}>
                  {formatPKR(item.amount)}
                </Text>
                <TouchableOpacity onPress={() => markAsPaid(item)} style={styles.doneBtn}>
                  <Text style={styles.doneText}>Mark Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  tabHeader: { flexDirection: 'row', backgroundColor: '#FFF', paddingTop: 50 },
  tab: { flex: 1, padding: 15, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#1E3A5F' },
  tabText: { color: '#999', fontWeight: 'bold' },
  activeTabText: { color: '#1E3A5F', fontWeight: 'bold' },
  ledgerCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFF', margin: 10, borderRadius: 12, elevation: 2 },
  name: { fontSize: 16, fontWeight: 'bold' },
  dueDate: { fontSize: 12, color: '#E74C3C', marginTop: 4 },
  amount: { fontSize: 16, fontWeight: 'bold' },
  doneBtn: { marginTop: 10, backgroundColor: '#EEE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
  doneText: { fontSize: 10, fontWeight: 'bold', color: '#1E3A5F' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center' }
});