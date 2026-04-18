/**
 * Ollama Response Parser
 * Extracts structured transaction data from Ollama's conversational responses
 */

/**
 * Parse Ollama response and extract <data> blocks
 * 
 * @param {string} rawText - Raw response text from Ollama
 * @returns {object} - { displayText, extractedTransactions }
 * 
 * Example input:
 * "Got it! I'm recording a sale of PKR 50,000 today. Correct?
 *  <data>
 *  {"transactions": [{"type": "sale", "amount": 50000, ...}]}
 *  </data>"
 * 
 * Example output:
 * {
 *   displayText: "Got it! I'm recording a sale of PKR 50,000 today. Correct?",
 *   extractedTransactions: [{ type: "sale", amount: 50000, ... }]
 * }
 */
export function parseOllamaResponse(rawText) {
  let displayText = rawText;
  let extractedTransactions = [];

  if (!rawText || typeof rawText !== 'string') {
    return { displayText: '', extractedTransactions: [] };
  }

  try {
    // Find <data>...</data> block
    const dataMatch = rawText.match(/<data>([\s\S]*?)<\/data>/);

    if (dataMatch && dataMatch[1]) {
      try {
        const jsonStr = dataMatch[1].trim();
        const json = JSON.parse(jsonStr);

        // Extract transactions array from the JSON
        if (json.transactions && Array.isArray(json.transactions)) {
          extractedTransactions = json.transactions.map(tx => normalizeTransaction(tx));
        }

        // Remove the <data> block from the display text
        displayText = rawText
          .replace(/<data>[\s\S]*?<\/data>/g, '')
          .trim();

      } catch (parseError) {
        console.warn('Failed to parse JSON in <data> block:', parseError);
        // Keep the <data> block in display if parsing fails
      }
    }

  } catch (error) {
    console.warn('Error parsing Ollama response:', error);
    // Return the raw text as display if anything goes wrong
  }

  return {
    displayText: displayText || rawText,
    extractedTransactions
  };
}

/**
 * Normalize transaction data from Ollama response
 * Handles date normalization and validation
 */
function normalizeTransaction(tx) {
  return {
    type: tx.type || 'expense', // default to expense
    amount: parseFloat(tx.amount) || 0,
    category: tx.category || 'Other',
    counterparty: tx.counterparty || '',
    date: normalizeDateString(tx.date),
    dueDate: tx.dueDate ? normalizeDateString(tx.dueDate) : null,
    status: tx.status || 'pending',
    notes: tx.notes || ''
  };
}

/**
 * Normalize date strings from Ollama
 * Handles: "today", "tomorrow", "yesterday", relative dates, ISO strings
 */
function normalizeDateString(dateStr) {
  if (!dateStr) return null;

  const lowerDate = String(dateStr).toLowerCase().trim();

  // Handle relative dates
  if (lowerDate === 'today' || lowerDate === 'now') {
    return new Date().toISOString().split('T')[0];
  }

  if (lowerDate === 'yesterday') {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  if (lowerDate === 'tomorrow') {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  // Handle "in X days" or "X days from now"
  const daysMatch = lowerDate.match(/in\s+(\d+)\s+days?/i);
  if (daysMatch) {
    const daysFromNow = parseInt(daysMatch[1], 10);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysFromNow);
    return futureDate.toISOString().split('T')[0];
  }

  // Try parsing as ISO string (YYYY-MM-DD or full ISO)
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    // Fall through to fallback
  }

  // Fallback: return today
  console.warn(`Could not parse date: "${dateStr}", using today`);
  return new Date().toISOString().split('T')[0];
}

/**
 * Validate transaction data
 * Returns { isValid: boolean, errors: string[] }
 */
export function validateTransaction(tx) {
  const errors = [];

  if (!tx.type) {
    errors.push('Transaction type is required');
  } else if (!['sale', 'expense', 'receivable', 'payable'].includes(tx.type)) {
    errors.push(`Invalid transaction type: ${tx.type}`);
  }

  if (typeof tx.amount !== 'number' || tx.amount <= 0) {
    errors.push('Amount must be a positive number');
  }

  if (!tx.category || typeof tx.category !== 'string') {
    errors.push('Category is required');
  }

  if (!tx.date) {
    errors.push('Date is required');
  }

  // For receivables/payables, dueDate is important
  if ((tx.type === 'receivable' || tx.type === 'payable') && !tx.dueDate) {
    errors.push(`Due date is required for ${tx.type}`);
  }

  // For receivables/payables, counterparty is important
  if ((tx.type === 'receivable' || tx.type === 'payable') && !tx.counterparty) {
    errors.push(`Counterparty name is required for ${tx.type}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Extract all transactions from multiple Ollama responses
 * Useful for batch processing
 */
export function extractAllTransactions(responses) {
  return responses.reduce((acc, response) => {
    const { extractedTransactions } = parseOllamaResponse(response);
    return [...acc, ...extractedTransactions];
  }, []);
}
