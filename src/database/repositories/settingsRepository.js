import { getDatabase } from '../db';

/**
 * Settings Repository
 * Handles key-value settings storage
 */

/**
 * Set a setting value
 */
export async function setSetting(key, value) {
  const db = getDatabase();
  const now = new Date().toISOString();

  try {
    // Check if key exists
    const existing = await db.getFirstAsync(
      `SELECT key FROM settings WHERE key = ?`,
      [key]
    );

    if (existing) {
      // Update
      await db.runAsync(
        `UPDATE settings SET value = ?, updated_at = ? WHERE key = ?`,
        [String(value), now, key]
      );
    } else {
      // Insert
      await db.runAsync(
        `INSERT INTO settings (key, value, created_at, updated_at)
         VALUES (?, ?, ?, ?)`,
        [key, String(value), now, now]
      );
    }

    return { key, value };
  } catch (error) {
    console.error('Error setting setting:', error);
    throw error;
  }
}

/**
 * Get a setting value
 */
export async function getSetting(key, defaultValue = null) {
  const db = getDatabase();

  try {
    const result = await db.getFirstAsync(
      `SELECT value FROM settings WHERE key = ?`,
      [key]
    );

    return result ? result.value : defaultValue;
  } catch (error) {
    console.error('Error getting setting:', error);
    throw error;
  }
}

/**
 * Get all settings
 */
export async function getAllSettings() {
  const db = getDatabase();

  try {
    const results = await db.getAllAsync(`SELECT key, value FROM settings`);

    const settings = {};
    results.forEach(row => {
      settings[row.key] = row.value;
    });

    return settings;
  } catch (error) {
    console.error('Error fetching all settings:', error);
    throw error;
  }
}

/**
 * Delete a setting
 */
export async function deleteSetting(key) {
  const db = getDatabase();

  try {
    await db.runAsync(`DELETE FROM settings WHERE key = ?`, [key]);
    return true;
  } catch (error) {
    console.error('Error deleting setting:', error);
    throw error;
  }
}

/**
 * Ollama IP setting helpers
 */
export async function setOllamaIP(ip) {
  return setSetting('ollama_ip', ip);
}

export async function getOllamaIP() {
  return getSetting('ollama_ip', 'http://192.168.1.5:11434');
}

/**
 * Last Ollama connection status
 */
export async function setOllamaConnected(connected) {
  return setSetting('ollama_connected', connected ? 'true' : 'false');
}

export async function getOllamaConnected() {
  const value = await getSetting('ollama_connected', 'false');
  return value === 'true';
}

/**
 * App preferences
 */
export async function setCurrency(currency) {
  return setSetting('currency', currency);
}

export async function getCurrency() {
  return getSetting('currency', 'PKR');
}

export async function setTheme(theme) {
  return setSetting('theme', theme);
}

export async function getTheme() {
  return getSetting('theme', 'light');
}

export async function setLanguage(language) {
  return setSetting('language', language);
}

export async function getLanguage() {
  return getSetting('language', 'en');
}
