/**
 * Validators
 * Business logic validation functions
 */

/**
 * Validate business name
 */
export function validateBusinessName(name) {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Business name is required' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'Business name must be at least 2 characters' };
  }

  if (name.length > 100) {
    return { isValid: false, error: 'Business name must be less than 100 characters' };
  }

  return { isValid: true };
}

/**
 * Validate owner name
 */
export function validateOwnerName(name) {
  if (!name) return { isValid: true }; // Optional

  if (typeof name !== 'string') {
    return { isValid: false, error: 'Owner name must be text' };
  }

  if (name.length > 100) {
    return { isValid: false, error: 'Owner name must be less than 100 characters' };
  }

  return { isValid: true };
}

/**
 * Validate amount
 */
export function validateAmount(amount) {
  if (amount === undefined || amount === null) {
    return { isValid: false, error: 'Amount is required' };
  }

  const num = parseFloat(amount);

  if (isNaN(num)) {
    return { isValid: false, error: 'Amount must be a number' };
  }

  if (num < 0) {
    return { isValid: false, error: 'Amount must be positive' };
  }

  if (num === 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }

  return { isValid: true, value: num };
}

/**
 * Validate category
 */
export function validateCategory(category, type = 'expense') {
  if (!category || typeof category !== 'string') {
    return { isValid: false, error: 'Category is required' };
  }

  const validCategories = {
    'expense': [
      'Delivery', 'Electricity', 'Gas', 'Rent', 'Salaries',
      'Transport', 'Food & Supplies', 'Utilities', 'Other'
    ],
    'sale': ['Product Sale', 'Service', 'Other'],
    'receivable': ['Invoice', 'Advance', 'Refund', 'Other'],
    'payable': ['Invoice', 'Advance', 'Refund', 'Other']
  };

  const allowed = validCategories[type] || [];

  if (!allowed.includes(category)) {
    return { isValid: false, error: `Invalid category for ${type}` };
  }

  return { isValid: true };
}

/**
 * Validate date
 */
export function validateDate(dateISO) {
  if (!dateISO || typeof dateISO !== 'string') {
    return { isValid: false, error: 'Date is required' };
  }

  try {
    const date = new Date(dateISO);
    if (isNaN(date.getTime())) {
      return { isValid: false, error: 'Invalid date format' };
    }

    return { isValid: true };
  } catch (e) {
    return { isValid: false, error: 'Invalid date format' };
  }
}

/**
 * Validate counterparty (customer/vendor name)
 */
export function validateCounterparty(name, required = false) {
  if (!name && !required) {
    return { isValid: true }; // Optional if not required
  }

  if (!name) {
    return { isValid: false, error: 'Counterparty name is required' };
  }

  if (typeof name !== 'string') {
    return { isValid: false, error: 'Counterparty name must be text' };
  }

  if (name.length > 100) {
    return { isValid: false, error: 'Counterparty name must be less than 100 characters' };
  }

  return { isValid: true };
}

/**
 * Validate transaction type
 */
export function validateTransactionType(type) {
  const validTypes = ['sale', 'expense', 'receivable', 'payable'];

  if (!type || !validTypes.includes(type)) {
    return { isValid: false, error: `Transaction type must be one of: ${validTypes.join(', ')}` };
  }

  return { isValid: true };
}

/**
 * Validate transaction status
 */
export function validateTransactionStatus(status) {
  const validStatuses = ['completed', 'pending', 'overdue'];

  if (!status || !validStatuses.includes(status)) {
    return { isValid: false, error: `Status must be one of: ${validStatuses.join(', ')}` };
  }

  return { isValid: true };
}

/**
 * Validate opening balance
 */
export function validateOpeningBalance(balance) {
  if (balance === undefined || balance === null) {
    return { isValid: true, value: 0 }; // Default to 0
  }

  const num = parseFloat(balance);

  if (isNaN(num)) {
    return { isValid: false, error: 'Opening balance must be a number' };
  }

  if (num < 0) {
    return { isValid: false, error: 'Opening balance cannot be negative' };
  }

  return { isValid: true, value: num };
}

/**
 * Validate Ollama IP address
 */
export function validateOllamaIP(ip) {
  if (!ip || typeof ip !== 'string') {
    return { isValid: false, error: 'Ollama IP is required' };
  }

  const trimmed = ip.trim();

  // Must be http:// or https://
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { isValid: false, error: 'Ollama IP must start with http:// or https://' };
  }

  // Must include a port
  if (!trimmed.includes(':')) {
    return { isValid: false, error: 'Ollama IP must include port (e.g., http://192.168.1.5:11434)' };
  }

  return { isValid: true, value: trimmed };
}

/**
 * Validate full transaction object
 */
export function validateFullTransaction(tx) {
  const errors = [];

  // Type
  const typeValidation = validateTransactionType(tx.type);
  if (!typeValidation.isValid) errors.push(typeValidation.error);

  // Amount
  const amountValidation = validateAmount(tx.amount);
  if (!amountValidation.isValid) errors.push(amountValidation.error);

  // Category
  const categoryValidation = validateCategory(tx.category, tx.type);
  if (!categoryValidation.isValid) errors.push(categoryValidation.error);

  // Date
  const dateValidation = validateDate(tx.date);
  if (!dateValidation.isValid) errors.push(dateValidation.error);

  // Status
  const statusValidation = validateTransactionStatus(tx.status);
  if (!statusValidation.isValid) errors.push(statusValidation.error);

  // For receivables/payables, dueDate and counterparty are required
  if ((tx.type === 'receivable' || tx.type === 'payable')) {
    if (!tx.dueDate) {
      errors.push(`Due date is required for ${tx.type}`);
    } else {
      const dueDateValidation = validateDate(tx.dueDate);
      if (!dueDateValidation.isValid) errors.push(`Invalid due date: ${dueDateValidation.error}`);
    }

    const counterpartyValidation = validateCounterparty(tx.counterparty, true);
    if (!counterpartyValidation.isValid) errors.push(counterpartyValidation.error);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
