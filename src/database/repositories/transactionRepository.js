import { getDatabase } from '../db';

/**
 * Generate a UUID v4-compatible ID without requiring crypto APIs
 * Works reliably in React Native
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Transaction Repository
 * Handles all CRUD operations for transactions
 */

/**
 * Create a new transaction
 */
export async function createTransaction(transactionData) {
  const db = getDatabase();
  
  const {
    type,
    amount,
    category,
    counterparty = '',
    date,
    dueDate = null,
    status = 'pending',
    notes = ''
  } = transactionData;

  const id = generateUUID();
  const now = new Date().toISOString();

  try {
    await db.runAsync(
      `INSERT INTO transactions 
       (id, type, amount, category, counterparty, date, due_date, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, type, amount, category, counterparty, date, dueDate, status, notes, now, now]
    );

    return { id, ...transactionData, createdAt: now, updatedAt: now };
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

/**
 * Get transaction by ID
 */
export async function getTransactionById(id) {
  const db = getDatabase();

  try {
    const result = await db.getFirstAsync(
      `SELECT * FROM transactions WHERE id = ?`,
      [id]
    );

    return result ? formatTransaction(result) : null;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    throw error;
  }
}

/**
 * Get all transactions
 */
export async function getAllTransactions() {
  const db = getDatabase();

  try {
    const results = await db.getAllAsync(`SELECT * FROM transactions ORDER BY date DESC`);
    return results.map(formatTransaction);
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    throw error;
  }
}

/**
 * Get transactions by type (sale, expense, receivable, payable)
 */
export async function getTransactionsByType(type) {
  const db = getDatabase();

  try {
    const results = await db.getAllAsync(
      `SELECT * FROM transactions WHERE type = ? ORDER BY date DESC`,
      [type]
    );
    return results.map(formatTransaction);
  } catch (error) {
    console.error('Error fetching transactions by type:', error);
    throw error;
  }
}

/**
 * Get transactions by date range
 */
export async function getTransactionsByDateRange(startDate, endDate) {
  const db = getDatabase();

  try {
    const results = await db.getAllAsync(
      `SELECT * FROM transactions WHERE date BETWEEN ? AND ? ORDER BY date DESC`,
      [startDate, endDate]
    );
    return results.map(formatTransaction);
  } catch (error) {
    console.error('Error fetching transactions by date range:', error);
    throw error;
  }
}

/**
 * Get transactions by status
 */
export async function getTransactionsByStatus(status) {
  const db = getDatabase();

  try {
    const results = await db.getAllAsync(
      `SELECT * FROM transactions WHERE status = ? ORDER BY date DESC`,
      [status]
    );
    return results.map(formatTransaction);
  } catch (error) {
    console.error('Error fetching transactions by status:', error);
    throw error;
  }
}

/**
 * Get receivables (ALL receivables, not just pending)
 */
export async function getReceivables() {
  const db = getDatabase();

  try {
    const results = await db.getAllAsync(
      `SELECT * FROM transactions 
       WHERE type = 'receivable'
       ORDER BY due_date ASC`,
      []
    );
    return results.map(formatTransaction);
  } catch (error) {
    console.error('Error fetching receivables:', error);
    throw error;
  }
}

/**
 * Get payables (ALL payables, not just pending)
 */
export async function getPayables() {
  const db = getDatabase();

  try {
    const results = await db.getAllAsync(
      `SELECT * FROM transactions 
       WHERE type = 'payable'
       ORDER BY due_date ASC`,
      []
    );
    return results.map(formatTransaction);
  } catch (error) {
    console.error('Error fetching payables:', error);
    throw error;
  }
}

/**
 * Update transaction
 */
export async function updateTransaction(id, updateData) {
  const db = getDatabase();

  const {
    type,
    amount,
    category,
    counterparty,
    date,
    dueDate,
    status,
    notes
  } = updateData;

  const now = new Date().toISOString();

  try {
    const updates = [];
    const values = [];

    if (type !== undefined) { updates.push('type = ?'); values.push(type); }
    if (amount !== undefined) { updates.push('amount = ?'); values.push(amount); }
    if (category !== undefined) { updates.push('category = ?'); values.push(category); }
    if (counterparty !== undefined) { updates.push('counterparty = ?'); values.push(counterparty); }
    if (date !== undefined) { updates.push('date = ?'); values.push(date); }
    if (dueDate !== undefined) { updates.push('due_date = ?'); values.push(dueDate); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const query = `UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`;

    await db.runAsync(query, values);

    return getTransactionById(id);
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
}

/**
 * Delete transaction
 */
export async function deleteTransaction(id) {
  const db = getDatabase();

  try {
    await db.runAsync(`DELETE FROM transactions WHERE id = ?`, [id]);
    return true;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
}

/**
 * Get transaction summary (totals for each type)
 */
export async function getTransactionSummary() {
  const db = getDatabase();

  try {
    const result = await db.getFirstAsync(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'sale' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_sales,
        COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN type = 'receivable' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_receivables_paid,
        COALESCE(SUM(CASE WHEN type = 'receivable' AND status IN ('pending', 'overdue') THEN amount ELSE 0 END), 0) as total_receivables_pending,
        COALESCE(SUM(CASE WHEN type = 'payable' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_payables_paid,
        COALESCE(SUM(CASE WHEN type = 'payable' AND status IN ('pending', 'overdue') THEN amount ELSE 0 END), 0) as total_payables_pending
      FROM transactions
    `);

    return result;
  } catch (error) {
    console.error('Error fetching transaction summary:', error);
    throw error;
  }
}

/**
 * Get last N days of transactions for chart
 */
export async function getTransactionsByLastDays(days = 7) {
  const db = getDatabase();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateISO = startDate.toISOString().split('T')[0];

  try {
    const results = await db.getAllAsync(
      `SELECT * FROM transactions 
       WHERE date >= ? AND (type = 'sale' OR type = 'expense')
       ORDER BY date ASC`,
      [startDateISO]
    );

    return results.map(formatTransaction);
  } catch (error) {
    console.error('Error fetching transactions by last days:', error);
    throw error;
  }
}

/**
 * Format database result to transaction object
 */
function formatTransaction(dbResult) {
  return {
    id: dbResult.id,
    type: dbResult.type,
    amount: dbResult.amount,
    category: dbResult.category,
    counterparty: dbResult.counterparty,
    date: dbResult.date,
    dueDate: dbResult.due_date,
    status: dbResult.status,
    notes: dbResult.notes,
    createdAt: dbResult.created_at,
    updatedAt: dbResult.updated_at
  };
}
