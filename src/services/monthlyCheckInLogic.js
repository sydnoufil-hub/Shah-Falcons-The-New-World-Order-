/**
 * Monthly Check-in Logic
 * Handles monthly recurring expense updates
 */

import { getBusinessProfile, updateLastMonthlyCheckin } from '../database/repositories/businessProfileRepository';
import { isDateInCurrentMonth, isDateInPreviousMonth, getPreviousMonthRange, getCurrentMonthRange } from '../utils/dateUtils';
import { getTransactionsByDateRange } from '../database/repositories/transactionRepository';

/**
 * Check if monthly check-in is needed
 * Returns true if last check-in was in a previous month
 */
export async function isMonthlyCheckInNeeded() {
  try {
    const profile = await getBusinessProfile();

    if (!profile?.lastMonthlyCheckin) {
      return true; // Never done a check-in
    }

    return isDateInPreviousMonth(profile.lastMonthlyCheckin);

  } catch (error) {
    console.error('Error checking if monthly check-in needed:', error);
    return false;
  }
}

/**
 * Get previous month's recurring expenses
 * Used to compare and suggest changes
 */
export async function getPreviousMonthRecurringExpenses() {
  try {
    const { startDate, endDate } = getPreviousMonthRange();
    const transactions = await getTransactionsByDateRange(startDate, endDate);

    // Filter to recurring expense categories
    const recurringCategories = [
      'Electricity',
      'Gas',
      'Rent',
      'Salaries',
      'Internet',
      'Insurance'
    ];

    const recurring = transactions.filter(tx =>
      tx.type === 'expense' &&
      recurringCategories.includes(tx.category) &&
      tx.status === 'completed'
    );

    // Group by category and sum
    const grouped = {};
    recurring.forEach(tx => {
      grouped[tx.category] = (grouped[tx.category] || 0) + tx.amount;
    });

    return grouped;

  } catch (error) {
    console.error('Error getting previous month recurring expenses:', error);
    return {};
  }
}

/**
 * Get current month's recurring expenses so far
 */
export async function getCurrentMonthRecurringExpenses() {
  try {
    const { startDate, endDate } = getCurrentMonthRange();
    const transactions = await getTransactionsByDateRange(startDate, endDate);

    const recurringCategories = [
      'Electricity',
      'Gas',
      'Rent',
      'Salaries',
      'Internet',
      'Insurance'
    ];

    const recurring = transactions.filter(tx =>
      tx.type === 'expense' &&
      recurringCategories.includes(tx.category) &&
      tx.status === 'completed'
    );

    const grouped = {};
    recurring.forEach(tx => {
      grouped[tx.category] = (grouped[tx.category] || 0) + tx.amount;
    });

    return grouped;

  } catch (error) {
    console.error('Error getting current month recurring expenses:', error);
    return {};
  }
}

/**
 * Generate monthly check-in chat prompt
 * What the bot should say at the start of the month
 */
export async function generateMonthlyCheckInPrompt() {
  try {
    const previousMonthExpenses = await getPreviousMonthRecurringExpenses();

    if (Object.keys(previousMonthExpenses).length === 0) {
      return `It's a new month! Let's set up your recurring expenses. 
What are your regular monthly costs? For example:
- Rent
- Electricity  
- Salaries
- Any other regular bills?`;
    }

    // Build comparison prompt
    let prompt = `It's a new month! Let's check your recurring expenses.\n\nLast month you had:\n`;

    Object.entries(previousMonthExpenses).forEach(([category, amount]) => {
      prompt += `- ${category}: PKR ${amount.toFixed(0)}\n`;
    });

    prompt += `\nHave any of these changed? Or any new expenses to add?`;

    return prompt;

  } catch (error) {
    console.error('Error generating monthly check-in prompt:', error);
    return 'It\'s a new month! Let\'s update your recurring expenses. Any changes to rent, electricity, salaries, or other regular costs?';
  }
}

/**
 * Record monthly check-in as completed
 */
export async function recordMonthlyCheckIn() {
  try {
    const today = new Date().toISOString();
    return await updateLastMonthlyCheckin(today);
  } catch (error) {
    console.error('Error recording monthly check-in:', error);
    throw error;
  }
}

/**
 * Get comparison between months
 */
export async function getMonthlyComparison() {
  try {
    const previousMonth = await getPreviousMonthRecurringExpenses();
    const currentMonth = await getCurrentMonthRecurringExpenses();

    const comparison = {};
    const allCategories = new Set([
      ...Object.keys(previousMonth),
      ...Object.keys(currentMonth)
    ]);

    allCategories.forEach(category => {
      const prev = previousMonth[category] || 0;
      const curr = currentMonth[category] || 0;
      const change = curr - prev;
      const percentChange = prev > 0 ? (change / prev) * 100 : 0;

      comparison[category] = {
        previousMonth: prev,
        currentMonth: curr,
        change,
        percentChange: percentChange.toFixed(1),
        status: change > 0 ? 'increased' : change < 0 ? 'decreased' : 'same'
      };
    });

    return comparison;

  } catch (error) {
    console.error('Error getting monthly comparison:', error);
    return {};
  }
}

/**
 * Get recurring expense suggestions
 * Based on what changed significantly
 */
export async function getRecurringExpenseSuggestions() {
  try {
    const comparison = await getMonthlyComparison();
    const suggestions = [];

    Object.entries(comparison).forEach(([category, data]) => {
      const percentChange = parseFloat(data.percentChange);

      if (Math.abs(percentChange) > 20) {
        suggestions.push({
          category,
          message: `${category} ${data.status} by ${Math.abs(percentChange)}% compared to last month`,
          previousAmount: data.previousMonth,
          currentAmount: data.currentMonth,
          change: data.change,
          severity: Math.abs(percentChange) > 50 ? 'high' : 'medium'
        });
      }
    });

    return suggestions;

  } catch (error) {
    console.error('Error getting expense suggestions:', error);
    return [];
  }
}

/**
 * Estimate next month's expenses based on trends
 */
export async function estimateNextMonthExpenses() {
  try {
    const comparison = await getMonthlyComparison();
    const estimates = {};

    Object.entries(comparison).forEach(([category, data]) => {
      const trend = data.currentMonth >= data.previousMonth ? 0.1 : -0.05; // 10% increase or 5% decrease
      estimates[category] = data.currentMonth * (1 + trend);
    });

    return estimates;

  } catch (error) {
    console.error('Error estimating next month expenses:', error);
    return {};
  }
}
