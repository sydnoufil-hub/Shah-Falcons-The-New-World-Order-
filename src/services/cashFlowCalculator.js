/**
 * Cash Flow Calculator
 * Calculates all financial metrics for the dashboard
 */

import { getTransactionSummary, getReceivables, getPayables } from '../database/repositories/transactionRepository';
import { getBusinessProfile } from '../database/repositories/businessProfileRepository';

/**
 * Calculate complete financial position
 * Returns all key metrics for the dashboard
 */
export async function calculateFinancialPosition() {
  try {
    const profile = await getBusinessProfile();
    const summary = await getTransactionSummary();
    const receivables = await getReceivables();
    const payables = await getPayables();

    const openingBalance = profile?.openingBalance || 0;

    // Core calculation per requirements:
    // Cash Position = Opening Balance + Total Sales - Total Expenses
    //                + Received Payments - Paid Payables
    const totalSalesCompleted = summary.total_sales || 0;
    const totalExpensesCompleted = summary.total_expenses || 0;
    const totalReceivablesPaid = summary.total_receivables_paid || 0;
    const totalPayablesPaid = summary.total_payables_paid || 0;

    const cashPosition = 
      openingBalance + 
      totalSalesCompleted - 
      totalExpensesCompleted + 
      totalReceivablesPaid - 
      totalPayablesPaid;

    // Total amounts owed TO the business
    const totalReceivablesPending = summary.total_receivables_pending || 0;
    const totalReceivablesAmount = totalReceivablesPaid + totalReceivablesPending;

    // Total amounts owed BY the business
    const totalPayablesPending = summary.total_payables_pending || 0;
    const totalPayablesAmount = totalPayablesPaid + totalPayablesPending;

    // Net position (what the business can call its own, considering debts)
    const netPosition = totalReceivablesAmount - totalPayablesAmount;

    // Adjusted cash (cash position + pending receivables - pending payables)
    const adjustedCashPosition = 
      cashPosition + 
      totalReceivablesPending - 
      totalPayablesPending;

    return {
      // Core metrics
      openingBalance,
      cashPosition,
      adjustedCashPosition,
      
      // Income/Expenses
      totalSalesCompleted,
      totalExpensesCompleted,
      netIncome: totalSalesCompleted - totalExpensesCompleted,
      
      // Receivables
      totalReceivablesAmount,
      totalReceivablesPaid,
      totalReceivablesPending,
      receivablesCount: receivables.length,
      
      // Payables
      totalPayablesAmount,
      totalPayablesPaid,
      totalPayablesPending,
      payablesCount: payables.length,
      
      // Net position
      netPosition,
      
      // Health metrics
      healthScore: calculateHealthScore(
        cashPosition,
        totalReceivablesPending,
        totalPayablesPending,
        totalExpensesCompleted
      ),
      
      // Timestamps
      calculatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error calculating financial position:', error);
    throw error;
  }
}

/**
 * Calculate cash on hand
 * Money actually available right now
 */
export async function calculateCashOnHand() {
  const position = await calculateFinancialPosition();
  return position.cashPosition;
}

/**
 * Calculate projected cash (including pending receivables/payables)
 */
export async function calculateProjectedCash() {
  const position = await calculateFinancialPosition();
  return position.adjustedCashPosition;
}

/**
 * Calculate net income (sales - expenses)
 */
export async function calculateNetIncome(startDate = null, endDate = null) {
  const summary = await getTransactionSummary();
  const sales = summary.total_sales || 0;
  const expenses = summary.total_expenses || 0;

  return sales - expenses;
}

/**
 * Calculate average daily spending
 */
export async function calculateAverageDailySpending(days = 30) {
  const summary = await getTransactionSummary();
  const totalExpenses = summary.total_expenses || 0;

  if (days <= 0) return 0;
  return totalExpenses / days;
}

/**
 * Calculate runway (how many days of expenses can be covered)
 */
export async function calculateRunway() {
  try {
    const position = await calculateFinancialPosition();
    const averageDaily = await calculateAverageDailySpending(7);

    if (averageDaily <= 0) {
      return {
        days: Infinity,
        warning: 'No expense data available'
      };
    }

    const days = Math.floor(position.cashPosition / averageDaily);

    return {
      days: Math.max(0, days),
      cashAvailable: position.cashPosition,
      averageDailyExpense: averageDaily,
      warning: days < 30 ? `Only ${days} days of cash runway` : null
    };

  } catch (error) {
    console.error('Error calculating runway:', error);
    return {
      days: 0,
      error: error.message
    };
  }
}

/**
 * Calculate health score (0-100)
 * Based on: cash position, receivables, payables, burn rate
 */
function calculateHealthScore(cashPosition, pendingReceivables, pendingPayables, monthlyExpenses) {
  let score = 50; // Base score

  // Cash position (max +30)
  if (cashPosition > 0) {
    const months = monthlyExpenses > 0 ? cashPosition / monthlyExpenses : 0;
    score += Math.min(30, Math.max(0, months * 10));
  } else {
    score -= 30;
  }

  // Receivables vs Payables (max +20)
  const creditBalance = pendingReceivables - pendingPayables;
  if (creditBalance > 0) {
    score += Math.min(20, creditBalance / 10000);
  } else if (creditBalance < 0) {
    score -= Math.min(20, Math.abs(creditBalance) / 10000);
  }

  // Clamp between 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Get cash flow trend (comparing periods)
 */
export async function getCashFlowTrend() {
  try {
    const position = await calculateFinancialPosition();

    return {
      currentCash: position.cashPosition,
      adjustedCash: position.adjustedCashPosition,
      trend: position.cashPosition >= 0 ? 'positive' : 'negative',
      healthScore: position.healthScore,
      alerts: await getFinancialAlerts()
    };

  } catch (error) {
    console.error('Error getting cash flow trend:', error);
    return null;
  }
}

/**
 * Calculate days of payables outstanding (DPO)
 * How long the business takes to pay suppliers
 */
export async function calculateDaysPayablesOutstanding(days = 30) {
  const summary = await getTransactionSummary();
  const totalPayables = summary.total_payables_pending || 0;
  const totalExpenses = summary.total_expenses || 0;

  if (totalExpenses === 0) return 0;

  return (totalPayables / (totalExpenses / days)).toFixed(1);
}

/**
 * Calculate days of sales outstanding (DSO)
 * How long it takes to collect payments from customers
 */
export async function calculateDaysSalesOutstanding(days = 30) {
  const summary = await getTransactionSummary();
  const totalReceivables = summary.total_receivables_pending || 0;
  const totalSales = summary.total_sales || 0;

  if (totalSales === 0) return 0;

  return (totalReceivables / (totalSales / days)).toFixed(1);
}

/**
 * Get financial alerts
 */
export async function getFinancialAlerts() {
  try {
    const position = await calculateFinancialPosition();
    const runway = await calculateRunway();
    const payables = await getPayables();
    const receivables = await getReceivables();

    const alerts = [];

    // Low cash alert
    if (position.cashPosition < 0) {
      alerts.push({
        type: 'critical',
        message: `Cash position is negative (PKR ${position.cashPosition.toFixed(2)})`,
        action: 'Collect receivables or reduce expenses urgently'
      });
    } else if (position.cashPosition < position.totalPayablesPending) {
      alerts.push({
        type: 'warning',
        message: 'Cash position is lower than pending payables',
        action: 'Plan for upcoming payments carefully'
      });
    }

    // Low runway alert
    if (runway.days < 30 && runway.days > 0) {
      alerts.push({
        type: 'warning',
        message: `Only ${runway.days} days of cash runway remaining`,
        action: 'Plan to increase revenue or reduce expenses'
      });
    }

    // Overdue payables
    const overduePayables = payables.filter(p => p.status === 'overdue');
    if (overduePayables.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${overduePayables.length} overdue payments totaling PKR ${overduePayables.reduce((sum, p) => sum + p.amount, 0)}`,
        action: 'Process these payments immediately'
      });
    }

    // Overdue receivables
    const overdueReceivables = receivables.filter(r => r.status === 'overdue');
    if (overdueReceivables.length > 0) {
      alerts.push({
        type: 'info',
        message: `PKR ${overdueReceivables.reduce((sum, r) => sum + r.amount, 0)} in overdue receivables`,
        action: 'Follow up with customers for payment'
      });
    }

    return alerts;

  } catch (error) {
    console.error('Error getting financial alerts:', error);
    return [];
  }
}
