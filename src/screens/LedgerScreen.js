import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useTransactions } from '../hooks/useTransactions';
import { formatPKR } from '../utils/currencyFormatter';
import { COLORS } from '../constants/constants';

export default function LedgerScreen() {
  const { receivables, payables, update } = useTransactions();
  const [activeTab, setActiveTab] = useState('receivable');

  const data = activeTab === 'receivable' ? receivables : payables;

  const markAsPaid = async (item) => {
    // Logic to change status to 'completed'
    await update(item.id, { ...item, status: 'completed' });
  };

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

      <FlatList
        data={data.filter(t => t.status === 'pending' || t.status === 'overdue')}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.ledgerCard}>
            <View>
              <Text style={styles.name}>{item.counterparty || 'Unnamed'}</Text>
              <Text style={styles.dueDate}>Due: {item.dueDate}</Text>
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
  doneText: { fontSize: 10, fontWeight: 'bold', color: '#1E3A5F' }
});