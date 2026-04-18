/**
 * App Constants
 * Centralized configuration and constants
 */

// Colors
export const COLORS = {
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

// Currency
export const DEFAULT_CURRENCY = 'PKR';

// Transaction Types
export const TRANSACTION_TYPES = {
  SALE: 'sale',
  EXPENSE: 'expense',
  RECEIVABLE: 'receivable',
  PAYABLE: 'payable'
};

// Transaction Status
export const TRANSACTION_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  OVERDUE: 'overdue'
};

// Expense Categories
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

// Sale Categories
export const SALE_CATEGORIES = [
  'Product Sale',
  'Service',
  'Other'
];

// Receivable/Payable Categories
export const CREDIT_CATEGORIES = [
  'Invoice',
  'Advance',
  'Refund',
  'Other'
];

// Ollama Models (recommended)
export const OLLAMA_MODELS = [
  {
    name: 'llama2',
    displayName: 'Llama 2 (Recommended)',
    description: 'Fast and good instruction following'
  },
  {
    name: 'llama3.2',
    displayName: 'Llama 3.2',
    description: 'Latest, more accurate responses'
  },
  {
    name: 'mistral',
    displayName: 'Mistral',
    description: 'Fast and efficient'
  },
  {
    name: 'neural-chat',
    displayName: 'Neural Chat',
    description: 'Optimized for conversations'
  }
];

// Default Ollama Settings
export const OLLAMA_DEFAULTS = {
  DEFAULT_IP: 'http://192.168.1.5:11434',
  DEFAULT_MODEL: 'llama2',
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  STREAM: false
};

// Chat Settings
export const CHAT_SETTINGS = {
  MAX_HISTORY_MESSAGES: 50,
  CONTEXT_WINDOW: 20,
  TYPING_INDICATOR_DELAY: 500
};

// Dashboard Settings
export const DASHBOARD_SETTINGS = {
  CHART_DAYS: 7,
  CHART_HEIGHT: 250,
  CHART_COLOR: COLORS.primary
};

// Date Formats
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  DISPLAY_SHORT: 'DD/MM/YYYY',
  DISPLAY_LONG: 'DD MMM YYYY',
  DISPLAY_FULL: 'DDDD, DD MMMM YYYY'
};

// Validation Rules
export const VALIDATION_RULES = {
  BUSINESS_NAME_MIN: 2,
  BUSINESS_NAME_MAX: 100,
  OWNER_NAME_MAX: 100,
  COUNTERPARTY_MAX: 100,
  NOTES_MAX: 500,
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 99999999
};

// API Endpoints
export const API_ENDPOINTS = {
  OLLAMA_CHAT: '/api/chat',
  OLLAMA_TAGS: '/api/tags',
  OLLAMA_PULL: '/api/pull',
  OLLAMA_SHOW: '/api/show'
};

// Recurring Expenses (for monthly check-in)
export const RECURRING_EXPENSES = [
  'Electricity',
  'Gas',
  'Rent',
  'Salaries',
  'Internet',
  'Insurance'
];

// Thresholds for alerts
export const ALERT_THRESHOLDS = {
  LOW_CASH_PERCENTAGE: 20, // Alert if cash is below 20% of receivables
  OVERDUE_DAYS: 0,          // Alert if past due date
  UPCOMING_DUE_DAYS: 2      // Alert if due within 2 days
};

// Storage Keys
export const STORAGE_KEYS = {
  BUSINESS_PROFILE: 'business_profile',
  TRANSACTIONS: 'transactions',
  CHAT_HISTORY: 'chat_history',
  SETTINGS: 'settings',
  OLLAMA_IP: 'ollama_ip',
  OLLAMA_CONNECTED: 'ollama_connected'
};

// API Response Codes
export const API_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500
};

// Pagination
export const PAGINATION = {
  TRANSACTIONS_PER_PAGE: 20,
  CHAT_MESSAGES_PER_PAGE: 50
};

// Chart Configuration
export const CHART_CONFIG = {
  BACKGROUND_COLOR: COLORS.background,
  CHART_CONFIG: {
    backgroundColor: COLORS.background,
    backgroundGradientFrom: COLORS.light,
    backgroundGradientTo: COLORS.light,
    color: (opacity = 1) => `rgba(30, 58, 95, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false
  }
};

// Themes
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
};

// Languages
export const LANGUAGES = {
  ENGLISH: 'en',
  URDU: 'ur'
};
