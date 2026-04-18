/**
 * Ollama Service
 * Handles all communication with the local Ollama AI server
 */

import { CASHFLOW_SYSTEM_PROMPT } from './systemPrompt';
import { getChatHistoryForOllama } from '../database/repositories/chatHistoryRepository';
import { getOllamaIP, setOllamaConnected } from '../database/repositories/settingsRepository';

const MODEL = 'llama2'; // fallback model, can be overridden
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const OLLAMA_API_ENDPOINT = '/api/chat';

/**
 * Send a message to Ollama and get a response
 * Automatically includes full conversation history
 * 
 * @param {string} userMessage - The user's message
 * @param {object} options - Optional configuration
 * @returns {Promise<string>} - Ollama's response text
 */
export async function chatWithOllama(userMessage, options = {}) {
  const {
    timeout = DEFAULT_TIMEOUT,
    model = MODEL,
    systemPrompt = CASHFLOW_SYSTEM_PROMPT,
    includeHistory = true
  } = options;

  try {
    // Get Ollama server IP from settings
    const ollamaIP = await getOllamaIP();
    if (!ollamaIP) {
      throw new Error('Ollama server IP not configured. Please set it in Settings.');
    }

    // Build the conversation history
    let messages = [];
    if (includeHistory) {
      messages = await getChatHistoryForOllama(20); // Last 20 messages for context
    }

    // Add the current user message
    messages.push({
      role: 'user',
      content: userMessage
    });

    // Prepare the API request
    const requestBody = {
      model,
      stream: false,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        ...messages
      ]
    };

    // Make the API call
    const response = await fetchWithTimeout(
      `${ollamaIP}${OLLAMA_API_ENDPOINT}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      },
      timeout
    );

    // Mark Ollama as connected
    await setOllamaConnected(true);

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.message || !data.message.content) {
      throw new Error('Unexpected Ollama response format');
    }

    return data.message.content;

  } catch (error) {
    // Mark Ollama as disconnected if it's a connection error
    if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
      await setOllamaConnected(false);
    }

    console.error('Error communicating with Ollama:', error);
    throw error;
  }
}

/**
 * Test the connection to Ollama server
 * 
 * @returns {Promise<boolean>} - true if Ollama is reachable
 */
export async function testOllamaConnection() {
  try {
    const ollamaIP = await getOllamaIP();
    if (!ollamaIP) {
      return false;
    }

    const response = await fetchWithTimeout(
      `${ollamaIP}/api/tags`,
      { method: 'GET' },
      5000 // 5 second timeout for test
    );

    const isConnected = response.ok;
    await setOllamaConnected(isConnected);
    return isConnected;

  } catch (error) {
    console.warn('Ollama connection test failed:', error);
    await setOllamaConnected(false);
    return false;
  }
}

/**
 * Get list of available models on the Ollama server
 * 
 * @returns {Promise<string[]>} - Array of model names
 */
export async function getAvailableModels() {
  try {
    const ollamaIP = await getOllamaIP();
    if (!ollamaIP) {
      throw new Error('Ollama server IP not configured');
    }

    const response = await fetchWithTimeout(
      `${ollamaIP}/api/tags`,
      { method: 'GET' },
      5000
    );

    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }

    const data = await response.json();
    return data.models?.map(m => m.name) || [];

  } catch (error) {
    console.error('Error fetching available models:', error);
    return [];
  }
}

/**
 * Get information about Ollama server
 * 
 * @returns {Promise<object>} - Server information
 */
export async function getOllamaInfo() {
  try {
    const ollamaIP = await getOllamaIP();
    if (!ollamaIP) {
      throw new Error('Ollama server IP not configured');
    }

    const isConnected = await testOllamaConnection();
    const models = isConnected ? await getAvailableModels() : [];

    return {
      ip: ollamaIP,
      isConnected,
      models,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error getting Ollama info:', error);
    return {
      ip: await getOllamaIP(),
      isConnected: false,
      models: [],
      error: error.message
    };
  }
}

/**
 * Fetch with timeout wrapper
 * Standard fetch doesn't have built-in timeout support
 * 
 * @private
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Stream a response from Ollama (for future use with streaming UI)
 * Note: Not used initially, but can be implemented for real-time chat display
 * 
 * @private
 */
export async function* streamChatWithOllama(userMessage, options = {}) {
  const {
    timeout = DEFAULT_TIMEOUT,
    model = MODEL,
    systemPrompt = CASHFLOW_SYSTEM_PROMPT
  } = options;

  try {
    const ollamaIP = await getOllamaIP();
    if (!ollamaIP) {
      throw new Error('Ollama server IP not configured');
    }

    const messages = await getChatHistoryForOllama(20);
    messages.push({ role: 'user', content: userMessage });

    const requestBody = {
      model,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    };

    const response = await fetch(`${ollamaIP}${OLLAMA_API_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(l => l.trim());

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            yield json.message.content;
          }
        } catch (e) {
          // Invalid JSON line, skip
        }
      }
    }

    await setOllamaConnected(true);

  } catch (error) {
    await setOllamaConnected(false);
    console.error('Error streaming from Ollama:', error);
    throw error;
  }
}

/**
 * Chat with Ollama using voice input and output
 * Requires voice input service for transcription and text-to-speech
 * 
 * @param {string} transcribedText - The transcribed voice input
 * @param {function} speakResponse - Function to speak the response
 * @param {object} options - Configuration options
 * @returns {Promise<string>} - Ollama's response text
 */
export async function chatWithOllamaVoice(transcribedText, speakResponse, options = {}) {
  try {
    if (!transcribedText || transcribedText.trim().length === 0) {
      throw new Error('No transcribed text provided for voice chat');
    }

    if (typeof speakResponse !== 'function') {
      throw new Error('speakResponse function is required for voice chat');
    }

    // Get response from Ollama using regular chat
    const response = await chatWithOllama(transcribedText, options);

    // Speak the response
    await speakResponse(response, {
      rate: options.speechRate || 1.0,
      pitch: options.speechPitch || 1.0,
      volume: options.speechVolume || 1.0
    });

    return response;

  } catch (error) {
    console.error('Error in voice chat:', error);
    throw error;
  }
}

/**
 * Process voice input and return structured response with voice feedback
 * Useful for transaction input via voice
 * 
 * @param {string} transcribedText - The transcribed voice input
 * @param {function} speakResponse - Function to speak the response
 * @param {object} options - Configuration options
 * @returns {Promise<object>} - Response with extracted data and audio feedback
 */
export async function processVoiceTransaction(transcribedText, speakResponse, options = {}) {
  try {
    if (!transcribedText || transcribedText.trim().length === 0) {
      throw new Error('No transcribed text provided');
    }

    // Use special transaction extraction prompt
    const transactionSystemPrompt = `${CASHFLOW_SYSTEM_PROMPT}\n\nThis is a voice input for a transaction. Extract the transaction details and respond with <data> block.`;

    // Get Ollama response
    const response = await chatWithOllama(transcribedText, {
      ...options,
      systemPrompt: transactionSystemPrompt
    });

    // Provide voice confirmation
    const confirmationMessage = "Transaction recorded. You can check it in the transactions list.";
    await speakResponse(confirmationMessage);

    return {
      transcript: transcribedText,
      response,
      confirmed: true,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error processing voice transaction:', error);
    throw error;
  }
}
