import { getChatHistoryForOllama } from '../database/repositories/chatHistoryRepository';
import { CASHFLOW_SYSTEM_PROMPT } from './systemPrompt';

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAI-XEnJ09Szh-vbjbqUjwhwpDwoX2tx4M';
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
      console.log(`[Gemini] Loaded ${conversationHistory.length} messages from history`);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;
    
    // Build contents array with full conversation history
    const contents = [];
    
    // Add system prompt with first user message
    if (conversationHistory.length === 0) {
      // No history - include system prompt with current message
      contents.push({
        role: 'user',
        parts: [{ text: systemPrompt + '\n\n' + userMessage }]
      });
    } else {
      // Add previous messages to contents
      conversationHistory.forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
      
      // Add current user message (with system prompt context)
      contents.push({
        role: 'user',
        parts: [{ text: systemPrompt + '\n\n' + userMessage }]
      });
    }
    
    console.log('[Gemini] Sending request to Gemini API with history');

    const response = await withTimeout(
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
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
      const responseText = data.candidates[0].content.parts[0].text;
      console.log('[Gemini] Response text:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
      return responseText;
    }
    
    throw new Error('Unexpected Gemini response format');
  } catch (error) {
    console.error('[Gemini] Chat Error:', error.message);
    throw error;
  }
}
