import { getOllamaIP, setOllamaConnected } from '../database/repositories/settingsRepository';

/**
 * Wraps a promise with a timeout
 */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Connection timeout after ${ms}ms`)), ms)
    )
  ]);
}

export async function testOllamaConnection() {
  try {
    const ip = await getOllamaIP();
    if (!ip) return { isConnected: false, error: 'IP not configured' };

    const startTime = Date.now();
    const url = `${ip}/api/tags`;
    console.log('[Ollama Test] Attempting to connect to:', url);
    
    // Wrap fetch with 3-second timeout
    const response = await withTimeout(
      fetch(url, { method: 'GET' }),
      3000
    );

    const isConnected = response.ok;
    const latency = Date.now() - startTime;

    console.log('[Ollama Test] Response status:', response.status, 'Latency:', latency + 'ms');
    
    await setOllamaConnected(isConnected);

    if (!isConnected) {
      return { isConnected: false, error: `Server returned status ${response.status}` };
    }

    return { isConnected: true, latency };
  } catch (error) {
    console.log('[Ollama Test] Error:', error.message);
    await setOllamaConnected(false);
    return { isConnected: false, error: error.message };
  }
}