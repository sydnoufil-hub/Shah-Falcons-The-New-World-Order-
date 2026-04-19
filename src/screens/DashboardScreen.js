import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { useTransactions } from '../hooks/useTransactions';
import { formatPKR } from '../utils/currencyFormatter';
import { COLORS } from '../constants/constants';
import { MetricCard } from '../Components/MetricCard';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const { financialPosition, chartData, loading, error, loadTransactions } = useTransactions();

  // Refresh dashboard data whenever this screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('[Dashboard] 👁️ Screen focused, refreshing data...');
      loadTransactions();
    }, [loadTransactions])
  );

  // Fallback data if chartData isn't loaded yet
  const defaultChartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    cumulativeData: [0, 0, 0, 0, 0, 0, 0]
  };

  const chart = chartData || defaultChartData;

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: COLORS.primary }}>Loading data...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: 'red', fontSize: 16, marginBottom: 10 }}>Error Loading Data</Text>
        <Text style={{ color: 'red', fontSize: 12 }}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Daily Summary</Text>
        <Text style={styles.balanceLabel}>Current Cash Position</Text>
        <Text style={styles.mainBalance}>
          {formatPKR(financialPosition?.cashPosition || 0)}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <MetricCard label="To Receive" value={financialPosition?.totalReceivablesPending} color={COLORS.secondary} />
        <MetricCard label="To Pay" value={financialPosition?.totalPayablesPending} color={COLORS.danger} />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>7-Day Cash Flow</Text>
        {chart.labels && chart.labels.length > 0 ? (
          <LineChart
            data={{
              labels: chart.labels,
              datasets: [
                { data: chart.cumulativeData || defaultChartData.cumulativeData, color: () => COLORS.primary }
              ]
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#FFF',
              backgroundGradientFrom: '#FFF',
              backgroundGradientTo: '#FFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: "4", strokeWidth: "2", stroke: COLORS.primary }
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        ) : (
          <View style={styles.emptyChart}>
            <Text style={{ color: '#999', fontSize: 14 }}>No transaction data yet</Text>
          </View>
        )}
        <View style={styles.legend}>
          <Text style={{color: COLORS.primary, fontSize: 12}}>● Cumulative Cash Position</Text>
          <Text style={{color: COLORS.danger, fontSize: 12, marginLeft: 15}}>● Expenses</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 20
  },
  header: {
    backgroundColor: '#FFF',
    padding: 24,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8
  },
  balanceLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 8
  },
  mainBalance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E3A5F'
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20
  },
  chartContainer: {
    backgroundColor: '#FFF',
    margin: 20,
    padding: 15,
    borderRadius: 16,
    elevation: 3
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10
  },
  emptyChart: {
    height: 220,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0'
  }
});