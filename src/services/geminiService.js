import { getChatHistoryForOllama } from '../database/repositories/chatHistoryRepository';
import { CASHFLOW_SYSTEM_PROMPT } from './systemPrompt';

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyC2YNLk2diYvkckBRFUoxZPZI4aCfiwhUQ';
const DEFAULT_TIMEOUT = 30000;
const GEMINI_MODEL = 'gemini-2.5-flash'; // Latest fast model

// Validate API key on module load
if (!API_KEY) {
  console.warn('[Gemini] ⚠️  GEMINI_API_KEY not set in environment. Chat will fail.');
}

/**
 * Wraps a promise with a timeout
 */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms)
    )
  ]);
}

export async function chatWithGemini(userMessage, options = {}) {
  const {
    timeout = DEFAULT_TIMEOUT,
    systemPrompt = CASHFLOW_SYSTEM_PROMPT,
    includeHistory = true
  } = options;

  try {
    console.log('[Gemini] Starting chat request');
    
    let conversationHistory = [];
    if (includeHistory) {
      conversationHistory = await getChatHistoryForOllama(10);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;
    
    console.log('[Gemini] Sending request to Gemini API');

    const response = await withTimeout(
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: systemPrompt + '\n\n' + userMessage }]
            }
          ]
        })
      }),
      timeout
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gemini] Error response:', response.status, errorText);
      throw new Error(`Gemini API returned status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[Gemini] Got response successfully');
    
    // Extract text from Gemini response
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      return data.candidates[0].content.parts[0].text;
    }
    
    throw new Error('Unexpected Gemini response format');
  } catch (error) {
    console.error('[Gemini] Chat Error:', error.message);
    throw error;
  }
}
