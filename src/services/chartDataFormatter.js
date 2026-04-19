/**
 * Chart Data Formatter
 * Formats transaction data for chart display
 */

import { getTransactionsByLastDays } from '../database/repositories/transactionRepository';
import { getLastDaysRange } from '../utils/dateUtils';

/**
 * Get 7-day cumulative cash position chart data
 * Shows running cash balance over the last 7 days
 * Returns: { labels, cumulativeData, datasets }
 */
export async function get7DayCashFlowChartData() {
  try {
    const transactions = await getTransactionsByLastDays(7);
    const { startDate, endDate } = getLastDaysRange(7);

    // Get business profile for opening balance
    const { getBusinessProfile } = require('../database/repositories/businessProfileRepository');
    const profile = await getBusinessProfile();
    const openingBalance = profile?.openingBalance || 0;

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

    // Aggregate transactions (only completed sales/expenses)
    transactions.forEach(tx => {
      if (dataByDate[tx.date]) {
        if (tx.type === 'sale' && tx.status === 'completed') {
          dataByDate[tx.date].sales += tx.amount;
        } else if (tx.type === 'expense' && tx.status === 'completed') {
          dataByDate[tx.date].expenses += tx.amount;
        }
      }
    });

    // Calculate cumulative cash position for each day
    const sortedDates = Object.keys(dataByDate).sort();
    let runningBalance = openingBalance;
    
    const cumulativeData = sortedDates.map(date => {
      const dayData = dataByDate[date];
      runningBalance = runningBalance + dayData.sales - dayData.expenses;
      return runningBalance;
    });

    const labels = sortedDates.map(d => formatDateForChart(d));

    return {
      labels,
      cumulativeData,
      datasets: [
        {
          label: 'Cash Position',
          data: cumulativeData,
          borderColor: '#1E3A5F',
          backgroundColor: 'rgba(39, 174, 96, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#1E3A5F',
          pointBorderColor: '#FFF',
          pointRadius: 5
        }
      ],
      raw: dataByDate,
      openingBalance
    };

  } catch (error) {
    console.error('Error formatting 7-day chart data:', error);
    return {
      labels: [],
      cumulativeData: [],
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
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];
    
    // If today, show "Today"
    if (dateISO === todayISO) {
      return 'Today';
    }

    // If yesterday, show "Yesterday"
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split('T')[0];
    if (dateISO === yesterdayISO) {
      return 'Yest';
    }

    // Parse date without timezone issues
    const [year, month, day] = dateISO.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Get day of week - just 3 letters
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayNames[date.getDay()];
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
