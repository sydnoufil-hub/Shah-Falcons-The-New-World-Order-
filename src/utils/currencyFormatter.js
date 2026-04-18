/**
 * Currency Formatter
 * Formats numbers in Pakistani currency style
 */

/**
 * Format number as Pakistani Rupees
 * Example: 1234567 → "PKR 12,34,567"
 */
export function formatPKR(amount) {
  if (typeof amount !== 'number') {
    return 'PKR 0';
  }

  // Handle negative amounts
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  // Format with Pakistani comma style (groups of 2 after first 3 digits)
  const formatted = formatNumberPakistani(absAmount);

  return `PKR ${isNegative ? '-' : ''}${formatted}`;
}

/**
 * Format number in Pakistani style (groups of 2)
 * 1234567 → "12,34,567"
 */
function formatNumberPakistani(num) {
  const parts = Math.floor(num).toString().split('');
  const result = [];
  
  // Add decimal part if exists
  let decimalPart = '';
  if (num % 1 !== 0) {
    const decimals = num.toString().split('.')[1];
    if (decimals) {
      decimalPart = '.' + decimals.substring(0, 2);
    }
  }

  // Process integer part
  let count = 0;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (count === 3 || (count > 3 && (count - 3) % 2 === 0)) {
      result.unshift(',');
    }
    result.unshift(parts[i]);
    count++;
  }

  return result.join('') + decimalPart;
}

/**
 * Format any amount with currency symbol
 * @param {number} amount - The amount
 * @param {string} currency - Currency code ('PKR', 'USD', 'EUR', etc.)
 */
export function formatCurrency(amount, currency = 'PKR') {
  if (typeof amount !== 'number') {
    return '0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formatted = '';

  switch (currency) {
    case 'PKR':
      formatted = formatNumberPakistani(absAmount);
      return `PKR ${isNegative ? '-' : ''}${formatted}`;

    case 'USD':
      formatted = formatNumberUS(absAmount);
      return `$${isNegative ? '-' : ''}${formatted}`;

    case 'EUR':
      formatted = formatNumberUS(absAmount);
      return `€${isNegative ? '-' : ''}${formatted}`;

    default:
      formatted = formatNumberUS(absAmount);
      return `${isNegative ? '-' : ''}${formatted} ${currency}`;
  }
}

/**
 * Format number in US/standard style (groups of 3)
 * 1234567 → "1,234,567"
 */
function formatNumberUS(num) {
  const parts = Math.floor(num).toString().split('');
  const result = [];

  // Add decimal part if exists
  let decimalPart = '';
  if (num % 1 !== 0) {
    const decimals = num.toString().split('.')[1];
    if (decimals) {
      decimalPart = '.' + decimals.substring(0, 2);
    }
  }

  // Process integer part
  let count = 0;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) {
      result.unshift(',');
    }
    result.unshift(parts[i]);
    count++;
  }

  return result.join('') + decimalPart;
}

/**
 * Parse formatted currency back to number
 * "PKR 12,34,567" → 1234567
 */
export function parseCurrency(formattedString) {
  if (typeof formattedString !== 'string') {
    return 0;
  }

  // Remove currency symbols and letters
  const cleaned = formattedString.replace(/[^\d.-]/g, '');
  
  // Remove all commas
  const normalized = cleaned.replace(/,/g, '');

  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

/**
 * Format large numbers with abbreviations
 * 1234567 → "1.2M", 1234 → "1.2K"
 */
export function formatNumberShort(num) {
  if (typeof num !== 'number' || num === 0) {
    return '0';
  }

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1000000) {
    return sign + (absNum / 1000000).toFixed(1) + 'M';
  }

  if (absNum >= 1000) {
    return sign + (absNum / 1000).toFixed(1) + 'K';
  }

  return sign + absNum.toString();
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency = 'PKR') {
  const symbols = {
    'PKR': 'Rs',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
  };

  return symbols[currency] || currency;
}

/**
 * Format number for display in a card/dashboard
 * Automatically chooses between full and short format
 */
export function formatDisplayAmount(amount, currency = 'PKR') {
  if (Math.abs(amount) >= 1000000) {
    return formatNumberShort(amount);
  }

  return formatCurrency(amount, currency).replace(currency, '').trim();
}
