/**
 * Chart Data Formatter
 * Formats transaction data for chart display
 */

import { getTransactionsByLastDays } from '../database/repositories/transactionRepository';
import { getLastDaysRange } from '../utils/dateUtils';

/**
 * Get 7-day cash flow chart data
 * Returns: { labels, salesData, expenseData, netData }
 */
export async function get7DayCashFlowChartData() {
  try {
    const transactions = await getTransactionsByLastDays(7);
    const { startDate, endDate } = getLastDaysRange(7);

    // Group by date
    const dataByDate = {};

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateISO = date.toISOString().split('T')[0];

      dataByDate[dateISO] = {
        date: dateISO,
        sales: 0,
        expenses: 0,
        net: 0
      };
    }

    // Aggregate transactions
    transactions.forEach(tx => {
      if (dataByDate[tx.date]) {
        if (tx.type === 'sale') {
          dataByDate[tx.date].sales += tx.amount;
        } else if (tx.type === 'expense') {
          dataByDate[tx.date].expenses += tx.amount;
        }
      }
    });

    // Calculate net for each day
    Object.keys(dataByDate).forEach(date => {
      dataByDate[date].net = dataByDate[date].sales - dataByDate[date].expenses;
    });

    const sortedDates = Object.keys(dataByDate).sort();
    const labels = sortedDates.map(d => formatDateForChart(d));
    const salesData = sortedDates.map(d => dataByDate[d].sales);
    const expenseData = sortedDates.map(d => dataByDate[d].expenses);
    const netData = sortedDates.map(d => dataByDate[d].net);

    return {
      labels,
      datasets: [
        {
          label: 'Sales',
          data: salesData,
          borderColor: '#27AE60',
          backgroundColor: 'rgba(39, 174, 96, 0.1)',
          tension: 0.4
        },
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: '#E74C3C',
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          tension: 0.4
        },
        {
          label: 'Net',
          data: netData,
          borderColor: '#1E3A5F',
          backgroundColor: 'rgba(30, 58, 95, 0.1)',
          tension: 0.4
        }
      ],
      raw: dataByDate
    };

  } catch (error) {
    console.error('Error formatting 7-day chart data:', error);
    return {
      labels: [],
      datasets: [],
      raw: {}
    };
  }
}

/**
 * Get daily totals for chart
 * Returns array of { date, sales, expenses, net }
 */
export async function getDailyTotals(days = 7) {
  try {
    const chartData = await get7DayCashFlowChartData();
    return Object.values(chartData.raw);
  } catch (error) {
    console.error('Error getting daily totals:', error);
    return [];
  }
}

/**
 * Get monthly comparison data (this month vs last month)
 */
export async function getMonthlyComparisonData() {
  // This would require filtering by month from the transaction repository
  // For now, returning a template
  return {
    thisMonth: {
      sales: 0,
      expenses: 0,
      net: 0
    },
    lastMonth: {
      sales: 0,
      expenses: 0,
      net: 0
    },
    comparison: {
      salesGrowth: 0,
      expenseGrowth: 0,
      netGrowth: 0
    }
  };
}

/**
 * Get category breakdown for pie chart
 */
export async function getCategoryBreakdown(type = 'expense', limit = null) {
  try {
    // This would require additional filtering capability
    // For now, returning template
    return {
      labels: [],
      data: [],
      colors: []
    };
  } catch (error) {
    console.error('Error getting category breakdown:', error);
    return {
      labels: [],
      data: [],
      colors: []
    };
  }
}

/**
 * Format date for chart label (shortened)
 * "2024-04-15" → "Apr 15" or "Mon"
 */
function formatDateForChart(dateISO) {
  try {
    const date = new Date(dateISO);
    const today = new Date();
    
    // If today, show "Today"
    if (dateISO === today.toISOString().split('T')[0]) {
      return 'Today';
    }

    // If yesterday, show "Yesterday"
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateISO === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    }

    // Otherwise show day of week + date
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch (e) {
    return dateISO;
  }
}

/**
 * Format large numbers for chart display
 * Used for Y-axis labels
 */
export function formatChartAxisValue(value) {
  if (value === 0) return '0';
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toString();
}

/**
 * Get trend indicator (up, down, flat)
 * Compares current period with previous
 */
export function getTrendIndicator(current, previous) {
  if (previous === 0) {
    return current > 0 ? 'up' : 'down';
  }

  const percentChange = ((current - previous) / previous) * 100;

  if (Math.abs(percentChange) < 2) {
    return 'flat';
  }

  return percentChange > 0 ? 'up' : 'down';
}

/**
 * Get trend percentage
 */
export function getTrendPercentage(current, previous) {
  if (previous === 0) {
    return current > 0 ? 100 : -100;
  }

  return (((current - previous) / previous) * 100).toFixed(1);
}
