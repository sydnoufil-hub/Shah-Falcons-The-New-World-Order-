import { getDatabase } from '../db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Chat History Repository
 * Handles all CRUD operations for chat messages
 */

/**
 * Add a new chat message
 */
export async function addChatMessage(messageData) {
  const db = getDatabase();

  const {
    role, // 'user' | 'assistant'
    content,
    extractedData = null
  } = messageData;

  const id = uuidv4();
  const timestamp = new Date().toISOString();

  try {
    await db.runAsync(
      `INSERT INTO chat_messages 
       (id, role, content, timestamp, extracted_data)
       VALUES (?, ?, ?, ?, ?)`,
      [id, role, content, timestamp, extractedData ? JSON.stringify(extractedData) : null]
    );

    return { id, role, content, timestamp, extractedData };
  } catch (error) {
    console.error('Error adding chat message:', error);
    throw error;
  }
}

/**
 * Get all chat messages
 */
export async function getAllChatMessages() {
  const db = getDatabase();

  try {
    const results = await db.getAllAsync(
      `SELECT * FROM chat_messages ORDER BY timestamp ASC`
    );

    return results.map(formatMessage);
  } catch (error) {
    console.error('Error fetching all chat messages:', error);
    throw error;
  }
}

/**
 * Get chat message by ID
 */
export async function getChatMessageById(id) {
  const db = getDatabase();

  try {
    const result = await db.getFirstAsync(
      `SELECT * FROM chat_messages WHERE id = ?`,
      [id]
    );

    return result ? formatMessage(result) : null;
  } catch (error) {
    console.error('Error fetching chat message:', error);
    throw error;
  }
}

/**
 * Get chat messages by role
 */
export async function getChatMessagesByRole(role) {
  const db = getDatabase();

  try {
    const results = await db.getAllAsync(
      `SELECT * FROM chat_messages WHERE role = ? ORDER BY timestamp ASC`,
      [role]
    );

    return results.map(formatMessage);
  } catch (error) {
    console.error('Error fetching messages by role:', error);
    throw error;
  }
}

/**
 * Get last N chat messages
 */
export async function getLastChatMessages(limit = 20) {
  const db = getDatabase();

  try {
    const results = await db.getAllAsync(
      `SELECT * FROM chat_messages 
       ORDER BY timestamp DESC 
       LIMIT ?`,
      [limit]
    );

    return results.map(formatMessage).reverse();
  } catch (error) {
    console.error('Error fetching last chat messages:', error);
    throw error;
  }
}

/**
 * Get chat history formatted for Ollama API (context window)
 * Returns messages in the format Ollama expects
 */
export async function getChatHistoryForOllama(limit = 20) {
  const messages = await getLastChatMessages(limit);

  return messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}

/**
 * Delete a chat message
 */
export async function deleteChatMessage(id) {
  const db = getDatabase();

  try {
    await db.runAsync(`DELETE FROM chat_messages WHERE id = ?`, [id]);
    return true;
  } catch (error) {
    console.error('Error deleting chat message:', error);
    throw error;
  }
}

/**
 * Clear all chat messages
 */
export async function clearChatHistory() {
  const db = getDatabase();

  try {
    await db.runAsync(`DELETE FROM chat_messages`);
    return true;
  } catch (error) {
    console.error('Error clearing chat history:', error);
    throw error;
  }
}

/**
 * Get chat messages from a specific date
 */
export async function getChatMessagesFromDate(date) {
  const db = getDatabase();

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const startISO = startOfDay.toISOString();

  try {
    const results = await db.getAllAsync(
      `SELECT * FROM chat_messages 
       WHERE timestamp >= ? 
       ORDER BY timestamp ASC`,
      [startISO]
    );

    return results.map(formatMessage);
  } catch (error) {
    console.error('Error fetching messages from date:', error);
    throw error;
  }
}

/**
 * Format database result to message object
 */
function formatMessage(dbResult) {
  return {
    id: dbResult.id,
    role: dbResult.role,
    content: dbResult.content,
    timestamp: dbResult.timestamp,
    extractedData: dbResult.extracted_data ? JSON.parse(dbResult.extracted_data) : null
  };
}
