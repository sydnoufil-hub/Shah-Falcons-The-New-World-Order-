/**
 * Overdue Detector
 * Identifies and tracks overdue receivables and payables
 */

import { getReceivables, getPayables, updateTransaction } from '../database/repositories/transactionRepository';
import { isDateInPast, daysUntilDue, getTodayISO } from '../utils/dateUtils';

/**
 * Get all overdue receivables
 */
export async function getOverdueReceivables() {
  try {
    const receivables = await getReceivables();

    return receivables.filter(r => {
      return isDateInPast(r.dueDate) && r.status === 'pending';
    }).map(r => ({
      ...r,
      daysOverdue: Math.abs(daysUntilDue(r.dueDate)),
      type: 'receivable'
    }));

  } catch (error) {
    console.error('Error getting overdue receivables:', error);
    return [];
  }
}

/**
 * Get all overdue payables
 */
export async function getOverduePayables() {
  try {
    const payables = await getPayables();

    return payables.filter(p => {
      return isDateInPast(p.dueDate) && p.status === 'pending';
    }).map(p => ({
      ...p,
      daysOverdue: Math.abs(daysUntilDue(p.dueDate)),
      type: 'payable'
    }));

  } catch (error) {
    console.error('Error getting overdue payables:', error);
    return [];
  }
}

/**
 * Get upcoming receivables due within N days
 */
export async function getUpcomingReceivables(days = 7) {
  try {
    const receivables = await getReceivables();

    return receivables.filter(r => {
      const daysUntil = daysUntilDue(r.dueDate);
      return daysUntil >= 0 && daysUntil <= days && r.status === 'pending';
    }).map(r => ({
      ...r,
      daysUntilDue: daysUntilDue(r.dueDate),
      type: 'receivable'
    }));

  } catch (error) {
    console.error('Error getting upcoming receivables:', error);
    return [];
  }
}

/**
 * Get upcoming payables due within N days
 */
export async function getUpcomingPayables(days = 7) {
  try {
    const payables = await getPayables();

    return payables.filter(p => {
      const daysUntil = daysUntilDue(p.dueDate);
      return daysUntil >= 0 && daysUntil <= days && p.status === 'pending';
    }).map(p => ({
      ...p,
      daysUntilDue: daysUntilDue(p.dueDate),
      type: 'payable'
    }));

  } catch (error) {
    console.error('Error getting upcoming payables:', error);
    return [];
  }
}

/**
 * Mark a transaction as overdue if its due date has passed
 */
export async function markAsOverdueIfNeeded(transaction) {
  try {
    if (!transaction.dueDate) return transaction;

    const isOverdue = isDateInPast(transaction.dueDate) && transaction.status === 'pending';

    if (isOverdue && transaction.status !== 'overdue') {
      return await updateTransaction(transaction.id, { status: 'overdue' });
    }

    return transaction;

  } catch (error) {
    console.error('Error marking as overdue:', error);
    return transaction;
  }
}

/**
 * Sync all overdue statuses
 * Call this periodically to update all transaction statuses
 */
export async function syncAllOverdueStatuses() {
  try {
    const receivables = await getReceivables();
    const payables = await getPayables();

    const updates = [];

    for (const item of [...receivables, ...payables]) {
      const shouldBeOverdue = isDateInPast(item.dueDate) && item.status === 'pending';

      if (shouldBeOverdue && item.status !== 'overdue') {
        updates.push(
          updateTransaction(item.id, { status: 'overdue' })
        );
      }
    }

    await Promise.all(updates);
    return updates.length;

  } catch (error) {
    console.error('Error syncing overdue statuses:', error);
    return 0;
  }
}

/**
 * Get overdue summary
 */
export async function getOverdueSummary() {
  try {
    const [overdueRec, overduePay, upcomingRec, upcomingPay] = await Promise.all([
      getOverdueReceivables(),
      getOverduePayables(),
      getUpcomingReceivables(7),
      getUpcomingPayables(7)
    ]);

    const totalOverdueReceivables = overdueRec.reduce((sum, r) => sum + r.amount, 0);
    const totalOverduePayables = overduePay.reduce((sum, p) => sum + p.amount, 0);

    return {
      overdueReceivables: {
        count: overdueRec.length,
        total: totalOverdueReceivables,
        items: overdueRec
      },
      overduePayables: {
        count: overduePay.length,
        total: totalOverduePayables,
        items: overduePay
      },
      upcomingReceivables: {
        count: upcomingRec.length,
        total: upcomingRec.reduce((sum, r) => sum + r.amount, 0),
        items: upcomingRec
      },
      upcomingPayables: {
        count: upcomingPay.length,
        total: upcomingPay.reduce((sum, p) => sum + p.amount, 0),
        items: upcomingPay
      },
      totalAtRisk: totalOverdueReceivables + totalOverduePayables
    };

  } catch (error) {
    console.error('Error getting overdue summary:', error);
    return null;
  }
}

/**
 * Get days overdue
 * Negative number means not yet due, 0 means due today
 */
export function getDaysOverdue(dueDate) {
  if (!dueDate) return null;

  const daysDiff = daysUntilDue(dueDate);

  return daysDiff < 0 ? Math.abs(daysDiff) : 0;
}

/**
 * Check if transaction is soon due
 */
export function isSoonDue(dueDate, withinDays = 2) {
  if (!dueDate) return false;

  const daysUntil = daysUntilDue(dueDate);
  return daysUntil >= 0 && daysUntil <= withinDays;
}

/**
 * Get overdue alert message
 */
export function getOverdueAlertMessage(overdues) {
  if (overdues.length === 0) {
    return '';
  }

  const totalAmount = overdues.reduce((sum, item) => sum + item.amount, 0);
  const maxDaysOverdue = Math.max(...overdues.map(item => item.daysOverdue || 0));

  return `${overdues.length} payment${overdues.length > 1 ? 's' : ''} overdue for ${maxDaysOverdue} days. Total: PKR ${totalAmount}`;
}
