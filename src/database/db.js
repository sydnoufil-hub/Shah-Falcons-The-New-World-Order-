import * as SQLite from 'expo-sqlite';

const DB_NAME = 'cashflow.db';
let database = null;
let initPromise = null;

/**
 * Initialize the database and create tables if they don't exist
 */
export async function initializeDatabase() {
  // Return existing initialization if already in progress
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      console.log('[DB] Opening database:', DB_NAME);
      
      // Open database with new API
      database = await SQLite.openDatabaseAsync(DB_NAME);
      console.log('[DB] Database opened successfully');
      
      // Enable WAL mode for better concurrency
      await database.execAsync('PRAGMA journal_mode = WAL;');
      
      // Create tables
      await createTables();
      
      console.log('[DB] All tables created successfully');
      console.log('[DB] Database initialized successfully');
      return database;
    } catch (error) {
      console.error('[DB] Error initializing database:', error);
      database = null;
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Get the database instance
 */
export function getDatabase() {
  if (!database) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return database;
}

/**
 * Create all tables
 */
async function createTables() {
  if (!database) {
    throw new Error('Database not available');
  }

  try {
    // Business Profile Table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS business_profile (
        id INTEGER PRIMARY KEY,
        business_name TEXT NOT NULL,
        owner_name TEXT,
        opening_balance REAL NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'PKR',
        setup_complete INTEGER NOT NULL DEFAULT 0,
        last_monthly_checkin TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Transactions Table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        counterparty TEXT,
        date TEXT NOT NULL,
        due_date TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Chat History Table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        extracted_data TEXT
      );
    `);

    // Settings Table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for performance
    await database.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_transactions_type_status ON transactions(type, status);
      CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON transactions(due_date);
      CREATE INDEX IF NOT EXISTS idx_chat_role ON chat_messages(role);
      CREATE INDEX IF NOT EXISTS idx_chat_timestamp ON chat_messages(timestamp);
    `);

    console.log('[DB] Tables created successfully');
  } catch (error) {
    console.error('[DB] Error creating tables:', error);
    throw error;
  }
}

/**
 * Close the database connection
 */
export async function closeDatabase() {
  if (database) {
    await database.closeAsync();
    database = null;
  }
}

/**
 * Reset the entire database (use with caution)
 */
export async function resetDatabase() {
  try {
    if (!database) {
      database = await SQLite.openDatabaseAsync(DB_NAME);
    }

    await database.execAsync(`
      DROP TABLE IF EXISTS business_profile;
      DROP TABLE IF EXISTS transactions;
      DROP TABLE IF EXISTS chat_messages;
      DROP TABLE IF EXISTS settings;
    `);

    await createTables();
    console.log('[DB] Database reset successfully');
  } catch (error) {
    console.error('[DB] Error resetting database:', error);
    throw error;
  }
}
