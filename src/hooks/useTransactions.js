import { useState, useCallback, useEffect } from 'react';
import {
  getAllTransactions,
  getTransactionsByType,
  getTransactionsByStatus,
  getReceivables,
  getPayables,
  getTransactionSummary,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsByLastDays
} from '../database/repositories/transactionRepository';
import { calculateFinancialPosition, getFinancialAlerts, calculateRunway } from '../services/cashFlowCalculator';
import { get7DayCashFlowChartData } from '../services/chartDataFormatter';
import { getOverdueSummary } from '../services/overdueDetector';

/**
 * useTransactions Hook
 * Manages all transaction data and financial calculations
 */
export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [receivables, setReceivables] = useState([]);
  const [payables, setPayables] = useState([]);

  const [financialPosition, setFinancialPosition] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [overdueSummary, setOverdueSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [runway, setRunway] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load all transactions and calculate metrics
   */
  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use allSettled to prevent one failure from cascading to all
      const results = await Promise.allSettled([
        getAllTransactions(),
        getReceivables(),
        getPayables(),
        calculateFinancialPosition(),
        get7DayCashFlowChartData(),
        getOverdueSummary(),
        calculateRunway(),
        getFinancialAlerts()
      ]);

      const [allTxResult, receivablesTxResult, payablesTxResult, positionResult, chartResult, overdueResult, runwayResult, alertsResult] = results;

      // Extract values with fallbacks
      const allTx = allTxResult.status === 'fulfilled' ? allTxResult.value : [];
      const receivablesTx = receivablesTxResult.status === 'fulfilled' ? receivablesTxResult.value : [];
      const payablesTx = payablesTxResult.status === 'fulfilled' ? payablesTxResult.value : [];
      const position = positionResult.status === 'fulfilled' ? positionResult.value : null;
      const chart = chartResult.status === 'fulfilled' ? chartResult.value : null;
      const overdue = overdueResult.status === 'fulfilled' ? overdueResult.value : null;
      const runwayData = runwayResult.status === 'fulfilled' ? runwayResult.value : null;
      const alertsList = alertsResult.status === 'fulfilled' ? alertsResult.value : [];

      setTransactions(allTx);
      setReceivables(receivablesTx);
      setPayables(payablesTx);
      setFinancialPosition(position);
      setChartData(chart);
      setOverdueSummary(overdue);
      setRunway(runwayData);
      setAlerts(alertsList);

      return { allTx, receivablesTx, payablesTx, position };
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new transaction
   */
  const createNew = useCallback(async (transactionData) => {
    try {
      setError(null);

      const newTx = await createTransaction(transactionData);

      // Reload all data to recalculate
      await loadTransactions();

      return newTx;
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError(err.message);
      throw err;
    }
  }, [loadTransactions]);

  /**
   * Update a transaction
   */
  const update = useCallback(async (id, updates) => {
    try {
      setError(null);

      const updated = await updateTransaction(id, updates);

      // Reload all data to recalculate
      await loadTransactions();

      return updated;
    } catch (err) {
      console.error('Error updating transaction:', err);
      setError(err.message);
      throw err;
    }
  }, [loadTransactions]);

  /**
   * Delete a transaction
   */
  const delete_ = useCallback(async (id) => {
    try {
      setError(null);

      await deleteTransaction(id);

      // Reload all data to recalculate
      await loadTransactions();
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError(err.message);
      throw err;
    }
  }, [loadTransactions]);

  /**
   * Get transactions by type
   */
  const getByType = useCallback(async (type) => {
    try {
      return await getTransactionsByType(type);
    } catch (err) {
      console.error('Error getting transactions by type:', err);
      return [];
    }
  }, []);

  /**
   * Get transactions by status
   */
  const getByStatus = useCallback(async (status) => {
    try {
      return await getTransactionsByStatus(status);
    } catch (err) {
      console.error('Error getting transactions by status:', err);
      return [];
    }
  }, []);

  /**
   * Recalculate all financial metrics
   */
  const recalculate = useCallback(async () => {
    try {
      setError(null);

      const [position, chart, overdue, runwayData, alertsList] = await Promise.all([
        calculateFinancialPosition(),
        get7DayCashFlowChartData(),
        getOverdueSummary(),
        calculateRunway(),
        getFinancialAlerts()
      ]);

      setFinancialPosition(position);
      setChartData(chart);
      setOverdueSummary(overdue);
      setRunway(runwayData);
      setAlerts(alertsList);

      return { position, chart, overdue, runwayData, alertsList };
    } catch (err) {
      console.error('Error recalculating metrics:', err);
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Get cash position
   */
  const getCashPosition = useCallback(() => {
    return financialPosition?.cashPosition || 0;
  }, [financialPosition]);

  /**
   * Get total receivables
   */
  const getTotalReceivables = useCallback(() => {
    return financialPosition?.totalReceivablesAmount || 0;
  }, [financialPosition]);

  /**
   * Get total payables
   */
  const getTotalPayables = useCallback(() => {
    return financialPosition?.totalPayablesAmount || 0;
  }, [financialPosition]);

  /**
   * Get net position (receivables - payables)
   */
  const getNetPosition = useCallback(() => {
    return financialPosition?.netPosition || 0;
  }, [financialPosition]);

  /**
   * Get health score
   */
  const getHealthScore = useCallback(() => {
    return financialPosition?.healthScore || 50;
  }, [financialPosition]);

  /**
   * Get overdue count
   */
  const getOverdueCount = useCallback(() => {
    if (!overdueSummary) return 0;
    return overdueSummary.overdueReceivables.count + overdueSummary.overduePayables.count;
  }, [overdueSummary]);

  /**
   * Filter transactions locally
   */
  const filterTransactions = useCallback((predicate) => {
    return transactions.filter(predicate);
  }, [transactions]);

  /**
   * Get total sales (completed)
   */
  const getTotalSales = useCallback(() => {
    return financialPosition?.totalSalesCompleted || 0;
  }, [financialPosition]);

  /**
   * Get total expenses (completed)
   */
  const getTotalExpenses = useCallback(() => {
    return financialPosition?.totalExpensesCompleted || 0;
  }, [financialPosition]);

  /**
   * Get net income
   */
  const getNetIncome = useCallback(() => {
    return financialPosition?.netIncome || 0;
  }, [financialPosition]);

  return {
    // State
    transactions,
    receivables,
    payables,
    financialPosition,
    chartData,
    overdueSummary,
    alerts,
    runway,
    loading,
    error,

    // Core functions
    loadTransactions,
    createNew,
    update,
    delete: delete_,
    getByType,
    getByStatus,
    recalculate,

    // Query functions
    getCashPosition,
    getTotalReceivables,
    getTotalPayables,
    getNetPosition,
    getHealthScore,
    getOverdueCount,
    getTotalSales,
    getTotalExpenses,
    getNetIncome,
    filterTransactions
  };
}
