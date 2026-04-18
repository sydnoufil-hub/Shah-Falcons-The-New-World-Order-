/**
 * Transaction Extractor
 * Extracts transactions from Ollama response and saves to database
 */

import { parseOllamaResponse, validateTransaction } from './ollamaResponseParser';
import { createTransaction } from '../database/repositories/transactionRepository';
import { validateFullTransaction } from '../utils/validators';
import { getTodayISO } from '../utils/dateUtils';

/**
 * Extract and save transactions from Ollama response
 * @returns {object} - { success: boolean, transactions: [], errors: [] }
 */
export async function extractAndSaveTransactions(ollamaResponse) {
  try {
    const { displayText, extractedTransactions } = parseOllamaResponse(ollamaResponse);

    if (extractedTransactions.length === 0) {
      return {
        success: true,
        transactions: [],
        displayText,
        message: 'No transaction data found in response'
      };
    }

    const results = {
      success: true,
      transactions: [],
      errors: [],
      displayText
    };

    for (const tx of extractedTransactions) {
      // Validate before saving
      const validation = validateFullTransaction(tx);

      if (!validation.isValid) {
        results.errors.push({
          transaction: tx,
          errors: validation.errors
        });
        continue;
      }

      try {
        // Normalize date if it says "today"
        const normalizedTx = {
          ...tx,
          date: tx.date === 'today' ? getTodayISO() : tx.date
        };

        const savedTx = await createTransaction(normalizedTx);
        results.transactions.push(savedTx);

      } catch (error) {
        results.errors.push({
          transaction: tx,
          error: error.message
        });
        results.success = false;
      }
    }

    return results;

  } catch (error) {
    console.error('Error extracting and saving transactions:', error);
    return {
      success: false,
      transactions: [],
      errors: [{ error: error.message }],
      displayText: ''
    };
  }
}

/**
 * Parse multiple Ollama responses and extract all transactions
 */
export async function extractFromMultipleResponses(responses) {
  const allResults = {
    success: true,
    transactions: [],
    errors: [],
    responses: []
  };

  for (const response of responses) {
    const result = await extractAndSaveTransactions(response);

    allResults.responses.push({
      displayText: result.displayText,
      transactionCount: result.transactions.length,
      errorCount: result.errors.length
    });

    allResults.transactions.push(...result.transactions);

    if (!result.success) {
      allResults.success = false;
    }

    allResults.errors.push(...result.errors);
  }

  return allResults;
}

/**
 * Validate transaction before saving (without saving)
 */
export function validateBeforeSaving(transaction) {
  return validateFullTransaction(transaction);
}

/**
 * Build transaction object from conversation context
 * Used when the bot extracts data partially
 */
export function buildTransactionFromContext(context) {
  return {
    type: context.type || 'expense',
    amount: context.amount || 0,
    category: context.category || 'Other',
    counterparty: context.counterparty || '',
    date: context.date || getTodayISO(),
    dueDate: context.dueDate || null,
    status: context.status || 'completed',
    notes: context.notes || ''
  };
}

/**
 * Extract transaction summary for confirmation message
 * Returns human-readable string describing the transaction
 */
export function createTransactionSummary(transaction) {
  const type = transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);
  const amount = `PKR ${transaction.amount.toFixed(0)}`;

  let summary = `${type}: ${amount}`;

  if (transaction.category) {
    summary += ` (${transaction.category})`;
  }

  if (transaction.counterparty) {
    summary += ` - ${transaction.counterparty}`;
  }

  if (transaction.dueDate) {
    summary += ` (due: ${transaction.dueDate})`;
  }

  return summary;
}

/**
 * Extract and format multiple transaction summaries
 */
export function createMultipleTransactionSummaries(transactions) {
  return transactions.map((tx, index) => {
    return `${index + 1}. ${createTransactionSummary(tx)}`;
  }).join('\n');
}

/**
 * Confirm transactions with user before saving
 * Returns formatted string asking for confirmation
 */
export function buildConfirmationMessage(transactions) {
  if (transactions.length === 0) {
    return 'No transactions to record.';
  }

  const summaries = createMultipleTransactionSummaries(transactions);

  return `I'm recording the following:\n\n${summaries}\n\nCorrect? (Yes/No)`;
}

/**
 * Extract transactions from free-form text
 * Simple pattern matching for common phrases
 */
export function extractFromFreeText(text) {
  const transactions = [];

  // Pattern: "sold/sold X amount"
  const saleMatch = text.match(/sold.*?([\d,]+)\s*(?:pkr|rupees?)?/i);
  if (saleMatch) {
    const amount = parseFloat(saleMatch[1].replace(/,/g, ''));
    transactions.push({
      type: 'sale',
      amount,
      category: 'Product Sale',
      date: getTodayISO(),
      status: 'completed'
    });
  }

  // Pattern: "spent/paid X on category"
  const expenseMatch = text.match(/(?:spent|paid)\s+(?:pkr\s+)?([\d,]+)\s+(?:on|for)\s+(\w+)/i);
  if (expenseMatch) {
    const amount = parseFloat(expenseMatch[1].replace(/,/g, ''));
    const category = expenseMatch[2];
    transactions.push({
      type: 'expense',
      amount,
      category,
      date: getTodayISO(),
      status: 'completed'
    });
  }

  return transactions;
}

/**
 * Parse transaction type from text
 */
export function parseTransactionType(text) {
  const lower = text.toLowerCase();

  if (lower.includes('sale') || lower.includes('sold') || lower.includes('earn') || lower.includes('revenue')) {
    return 'sale';
  }

  if (lower.includes('payable') || lower.includes('owe') || lower.includes('pay')) {
    return 'payable';
  }

  if (lower.includes('receivable') || lower.includes('receive') || lower.includes('owed')) {
    return 'receivable';
  }

  // Default to expense
  return 'expense';
}

/**
 * Parse amount from text
 */
export function parseAmountFromText(text) {
  const match = text.match(/([\d,]+(?:\.\d{1,2})?)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ''));
  }
  return 0;
}

/**
 * Extract due date from text
 */
export function extractDueDateFromText(text) {
  // Pattern: "due on 2024-04-20" or "due 20 Apr"
  const dueDateMatch = text.match(/due\s+(?:on\s+)?(\d{4}-\d{2}-\d{2}|\d{1,2}\s+\w+)/i);
  if (dueDateMatch) {
    return dueDateMatch[1];
  }

  // Pattern: "in 5 days"
  const daysMatch = text.match(/in\s+(\d+)\s+days?/i);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    return dueDate.toISOString().split('T')[0];
  }

  return null;
}
