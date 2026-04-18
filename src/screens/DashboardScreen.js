import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTransactions } from '../hooks/useTransactions';
import { formatPKR } from '../utils/currencyFormatter';
import { COLORS } from '../constants/constants';
import { MetricCard } from '../Components/MetricCard';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const { financialPosition, chartData } = useTransactions();

  // Fallback data if chartData isn't loaded yet
  const defaultChartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }]
  };

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
        <LineChart
          data={{
            labels: chartData?.labels || defaultChartData.labels,
            datasets: [
              { data: chartData?.netData || defaultChartData.datasets[0].data, color: () => COLORS.secondary },
              { data: chartData?.expenseData || defaultChartData.datasets[0].data, color: () => COLORS.danger }
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
        <View style={styles.legend}>
          <Text style={{color: COLORS.secondary, fontSize: 12}}>● Net Income</Text>
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
  }
});