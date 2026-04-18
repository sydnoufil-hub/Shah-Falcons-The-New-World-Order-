// Color constants - MUST be first export to avoid circular dependencies
const COLORS = {
  primary: '#1E3A5F',      // Deep blue
  secondary: '#27AE60',    // Green (positive)
  danger: '#E74C3C',       // Red (negative/overdue)
  warning: '#F39C12',      // Orange
  light: '#ECF0F1',        // Light gray
  dark: '#2C3E50',         // Dark gray
  border: '#BDC3C7',       // Border gray
  success: '#27AE60',
  error: '#E74C3C',
  background: '#FFFFFF',
  text: '#2C3E50'
};

// Validate COLORS object
if (!COLORS || typeof COLORS !== 'object' || !COLORS.primary) {
  throw new Error('COLORS constant initialization failed');
}

// Export COLORS first and separately
export { COLORS };

// All other constants
export const DEFAULT_CURRENCY = 'PKR';

export const TRANSACTION_TYPES = {
  SALE: 'sale',
  EXPENSE: 'expense',
  RECEIVABLE: 'receivable',
  PAYABLE: 'payable'
};

export const TRANSACTION_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  OVERDUE: 'overdue'
};

export const EXPENSE_CATEGORIES = [
  'Delivery',
  'Electricity',
  'Gas',
  'Rent',
  'Salaries',
  'Transport',
  'Food & Supplies',
  'Utilities',
  'Other'
];

export const STORAGE_KEYS = {
  BUSINESS_PROFILE: 'business_profile',
  TRANSACTIONS: 'transactions',
  CHAT_HISTORY: 'chat_history',
  SETTINGS: 'settings',
  OLLAMA_IP: 'ollama_ip',
  OLLAMA_CONNECTED: 'ollama_connected'
};