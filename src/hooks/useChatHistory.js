import { useState, useCallback, useEffect } from 'react';
import {
  getAllChatMessages,
  addChatMessage,
  getChatHistoryForOllama,
  deleteChatMessage,
  clearChatHistory
} from '../database/repositories/chatHistoryRepository';

/**
 * useChatHistory Hook
 * Manages chat messages and conversation history
 */
export function useChatHistory() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load all chat messages from database
   */
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const allMessages = await getAllChatMessages();
      setMessages(allMessages);

      return allMessages;
    } catch (err) {
      console.error('Error loading chat messages:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Add a new message to chat
   */
  const addMessage = useCallback(async (role, content, extractedData = null) => {
    try {
      setError(null);

      const newMessage = await addChatMessage({
        role,
        content,
        extractedData
      });

      // Add to local state
      setMessages(prev => [...prev, newMessage]);

      return newMessage;
    } catch (err) {
      console.error('Error adding message:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Add user message
   */
  const addUserMessage = useCallback(async (content) => {
    return addMessage('user', content);
  }, [addMessage]);

  /**
   * Add assistant message
   */
  const addAssistantMessage = useCallback(async (content, extractedData = null) => {
    return addMessage('assistant', content, extractedData);
  }, [addMessage]);

  /**
   * Get conversation history formatted for Ollama API
   */
  const getConversationHistory = useCallback(async (limit = 20) => {
    try {
      return await getChatHistoryForOllama(limit);
    } catch (err) {
      console.error('Error getting conversation history:', err);
      return [];
    }
  }, []);

  /**
   * Delete a specific message
   */
  const deleteMessage = useCallback(async (messageId) => {
    try {
      setError(null);

      await deleteChatMessage(messageId);

      // Remove from local state
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Clear all chat history
   */
  const clearHistory = useCallback(async () => {
    try {
      setError(null);

      await clearChatHistory();

      setMessages([]);
    } catch (err) {
      console.error('Error clearing chat history:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Get last N messages
   */
  const getLastMessages = useCallback((count = 10) => {
    return messages.slice(-count);
  }, [messages]);

  /**
   * Get message count
   */
  const getMessageCount = useCallback(() => {
    return messages.length;
  }, [messages]);

  /**
   * Get unread extracted data (transactions from messages)
   */
  const getExtractedData = useCallback(() => {
    return messages
      .filter(m => m.extractedData && m.extractedData.transactions)
      .flatMap(m => m.extractedData.transactions);
  }, [messages]);

  /**
   * Get last assistant message
   */
  const getLastAssistantMessage = useCallback(() => {
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    return assistantMessages[assistantMessages.length - 1] || null;
  }, [messages]);

  /**
   * Get last user message
   */
  const getLastUserMessage = useCallback(() => {
    const userMessages = messages.filter(m => m.role === 'user');
    return userMessages[userMessages.length - 1] || null;
  }, [messages]);

  /**
   * Add a voice message (user message with transcript)
   * @param {string} transcript - The transcribed text from voice
   * @param {string} originalContent - Optional original voice input note
   */
  const addVoiceMessage = useCallback(async (transcript, originalContent = null) => {
    try {
      const content = originalContent || transcript;
      const messageMetadata = {
        type: 'voice',
        transcript,
        timestamp: new Date().toISOString()
      };

      const newMessage = await addChatMessage({
        role: 'user',
        content,
        extractedData: messageMetadata
      });

      setMessages(prev => [...prev, newMessage]);
      return newMessage;
    } catch (err) {
      console.error('Error adding voice message:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Add a voice response from assistant (with optional audio marker)
   * @param {string} content - The response text
   * @param {boolean} wasSpoken - Whether this was spoken aloud
   * @param {object} extractedData - Any extracted transaction data
   */
  const addVoiceResponse = useCallback(async (content, wasSpoken = false, extractedData = null) => {
    try {
      const responseMetadata = extractedData || {};
      if (wasSpoken) {
        responseMetadata.spoken = true;
        responseMetadata.spokenAt = new Date().toISOString();
      }

      const newMessage = await addChatMessage({
        role: 'assistant',
        content,
        extractedData: responseMetadata
      });

      setMessages(prev => [...prev, newMessage]);
      return newMessage;
    } catch (err) {
      console.error('Error adding voice response:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Get all voice messages (messages from voice input)
   */
  const getVoiceMessages = useCallback(() => {
    return messages.filter(m => 
      m.role === 'user' && 
      m.extractedData && 
      m.extractedData.type === 'voice'
    );
  }, [messages]);

  /**
   * Get all spoken responses (assistant responses that were spoken aloud)
   */
  const getSpokenResponses = useCallback(() => {
    return messages.filter(m =>
      m.role === 'assistant' &&
      m.extractedData &&
      m.extractedData.spoken
    );
  }, [messages]);

  return {
    // State
    messages,
    loading,
    error,

    // Core functions
    loadMessages,
    addMessage,
    addUserMessage,
    addAssistantMessage,
    addVoiceMessage,
    addVoiceResponse,
    deleteMessage,
    clearHistory,

    // Query functions
    getConversationHistory,
    getLastMessages,
    getMessageCount,
    getExtractedData,
    getLastAssistantMessage,
    getLastUserMessage,
    getVoiceMessages,
    getSpokenResponses
  };
}
