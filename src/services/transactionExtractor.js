import { createTransaction } from '../database/repositories/transactionRepository';
import { getTodayISO } from '../utils/dateUtils';

// Map potential type variations to correct types
const TYPE_MAPPING = {
  'income': 'sale',
  'revenue': 'sale',
  'sale': 'sale',
  'expense': 'expense',
  'receivable': 'receivable',
  'payable': 'payable'
};

/**
 * Parse relative dates like "in 5 days", "by Friday", "next Monday" to YYYY-MM-DD
 */
function parseRelativeDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  const lowercased = dateStr.toLowerCase();
  const today = new Date();
  
  // Already a date format?
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // "in X days"
  const daysMatch = lowercased.match(/in\s+(\d+)\s+days?/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + days);
    return targetDate.toISOString().split('T')[0];
  }
  
  // "by Friday", "by Monday", etc
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < dayNames.length; i++) {
    if (lowercased.includes(dayNames[i])) {
      const targetDate = new Date(today);
      const currentDay = today.getDay();
      let daysUntil = i - currentDay;
      if (daysUntil <= 0) daysUntil += 7; // Next occurrence
      targetDate.setDate(targetDate.getDate() + daysUntil);
      return targetDate.toISOString().split('T')[0];
    }
  }
  
  // "next week", "next month"
  if (lowercased.includes('next week')) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + 7);
    return targetDate.toISOString().split('T')[0];
  }
  
  if (lowercased.includes('next month')) {
    const targetDate = new Date(today);
    targetDate.setMonth(targetDate.getMonth() + 1);
    return targetDate.toISOString().split('T')[0];
  }
  
  // "tomorrow"
  if (lowercased.includes('tomorrow')) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + 1);
    return targetDate.toISOString().split('T')[0];
  }
  
  // Can't parse - return null
  return null;
}

// A lightweight parser based on the one you provided
export function parseOllamaResponse(rawText) {
  let displayText = rawText;
  let extractedTransactions = [];

  if (!rawText || typeof rawText !== 'string') {
    console.log('[Parser] No text to parse');
    return { displayText: '', extractedTransactions: [] };
  }

  try {
    const dataMatch = rawText.match(/<data>([\s\S]*?)<\/data>/);
    if (dataMatch && dataMatch[1]) {
      console.log('[Parser] Found <data> block, parsing...');
      const json = JSON.parse(dataMatch[1].trim());
      extractedTransactions = json.transactions || [];
      console.log('[Parser] Found', extractedTransactions.length, 'transactions');
      displayText = rawText.replace(/<data>[\s\S]*?<\/data>/, '').trim();
    } else {
      console.log('[Parser] No <data> block found in response');
    }
  } catch (e) {
    console.warn('[Parser] Failed to parse data block:', e.message);
  }

  return { displayText, extractedTransactions };
}

export async function extractAndSaveTransactions(ollamaResponse) {
  try {
    const { displayText, extractedTransactions } = parseOllamaResponse(ollamaResponse);

    console.log(`[Extractor] 🔍 Parsing response: ${extractedTransactions.length} transaction(s) found`);

    if (extractedTransactions.length === 0) {
      console.log('[Extractor] ℹ️ No transactions extracted from this response');
      return { success: true, transactions: [], displayText };
    }

    const savedTransactions = [];

    for (const tx of extractedTransactions) {
      // Normalize transaction type (handle "income" -> "sale" mapping)
      const normalizedType = TYPE_MAPPING[tx.type?.toLowerCase()] || tx.type;
      
      // Parse dueDate if provided
      let parsedDueDate = null;
      if (tx.dueDate) {
        parsedDueDate = parseRelativeDate(tx.dueDate);
        console.log(`[Extractor] 📅 Parsed due date: "${tx.dueDate}" → "${parsedDueDate}"`);
      }
      
      console.log(`[Extractor] 💾 Saving transaction: ${tx.type} → ${normalizedType} - PKR ${tx.amount} (${tx.category}), status: ${tx.status}, due: ${parsedDueDate || 'none'}`);
      
      // Create the transaction in SQLite
      const newTx = await createTransaction({
        type: normalizedType,
        amount: tx.amount,
        category: tx.category,
        date: tx.date === 'today' ? getTodayISO() : (tx.date || getTodayISO()),
        counterparty: tx.counterparty || '',
        dueDate: parsedDueDate,
        status: tx.status || 'completed',
        notes: tx.notes || ''
      });
      savedTransactions.push(newTx);
      console.log(`[Extractor] ✅ Saved: ID=${newTx.id}, Type=${newTx.type}, Status=${newTx.status}, DueDate=${newTx.dueDate}`);
    }

    console.log(`[Extractor] 🎉 All ${savedTransactions.length} transaction(s) saved successfully`);
    return { success: true, transactions: savedTransactions, displayText };
  } catch (error) {
    console.error('[Extractor] ❌ Error:', error);
    throw error;
  }
}