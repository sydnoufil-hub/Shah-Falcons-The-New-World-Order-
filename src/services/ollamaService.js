import { getOllamaIP } from '../database/repositories/settingsRepository';
import { getChatHistoryForOllama } from '../database/repositories/chatHistoryRepository';
// Assuming you have your system prompt in a file or string
import { CASHFLOW_SYSTEM_PROMPT } from './systemPrompt'; 

const MODEL = 'llama3.2'; // Or 'mistral'
const DEFAULT_TIMEOUT = 120000; // 2 minutes for large models

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

export async function chatWithOllama(userMessage, options = {}) {
  const {
    timeout = DEFAULT_TIMEOUT,
    model = MODEL,
    systemPrompt = CASHFLOW_SYSTEM_PROMPT,
    includeHistory = true
  } = options;

  try {
    console.log('[Ollama] Starting chat request with model:', model);
    const ollamaIP = await getOllamaIP();
    if (!ollamaIP) throw new Error('Ollama server IP not configured.');

    let messages = [];
    if (includeHistory) {
      messages = await getChatHistoryForOllama(10); // get last 10 messages
    }

    messages.push({ role: 'user', content: userMessage });

    const url = `${ollamaIP}/api/chat`;
    console.log('[Ollama] Sending request to:', url);

    const response = await withTimeout(
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ]
        })
      }),
      timeout
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Ollama] Error response:', response.status, errorText);
      throw new Error(`Ollama server returned status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[Ollama] Got response successfully');
    return data.message.content;
  } catch (error) {
    console.error('[Ollama] Chat Error:', error.message);
    throw error;
  }
}