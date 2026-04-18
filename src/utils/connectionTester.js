/**
 * Connection Tester
 * Tests connectivity to Ollama and other services
 */

import { getOllamaIP, setOllamaConnected, getOllamaConnected } from '../database/repositories/settingsRepository';

/**
 * Test connection to Ollama server
 * Returns: { isConnected: boolean, ip: string, latency: number, error?: string }
 */
export async function testOllamaConnection() {
  try {
    const ip = await getOllamaIP();

    if (!ip) {
      return {
        isConnected: false,
        ip: null,
        latency: 0,
        error: 'Ollama IP not configured'
      };
    }

    const startTime = Date.now();

    try {
      const response = await fetch(`${ip}/api/tags`, {
        method: 'GET',
        timeout: 5000
      });

      const latency = Date.now() - startTime;
      const isConnected = response.ok;

      await setOllamaConnected(isConnected);

      if (!isConnected) {
        return {
          isConnected: false,
          ip,
          latency,
          error: `Server returned status ${response.status}`
        };
      }

      return {
        isConnected: true,
        ip,
        latency,
        models: response.ok ? (await response.json()).models?.length || 0 : 0
      };

    } catch (fetchError) {
      const latency = Date.now() - startTime;
      await setOllamaConnected(false);

      return {
        isConnected: false,
        ip,
        latency,
        error: fetchError.message || 'Failed to connect'
      };
    }

  } catch (error) {
    console.error('Error testing Ollama connection:', error);
    return {
      isConnected: false,
      ip: null,
      latency: 0,
      error: error.message
    };
  }
}

/**
 * Get cached connection status (no actual test)
 * Faster than testOllamaConnection but may be stale
 */
export async function getCachedConnectionStatus() {
  const isConnected = await getOllamaConnected();
  const ip = await getOllamaIP();

  return {
    isConnected,
    ip
  };
}

/**
 * Test if a URL is reachable (generic)
 */
export async function testURLConnection(url, options = {}) {
  const {
    method = 'GET',
    timeout = 5000
  } = options;

  try {
    const startTime = Date.now();

    const response = await fetch(url, {
      method,
      timeout
    });

    const latency = Date.now() - startTime;

    return {
      isConnected: response.ok,
      statusCode: response.status,
      statusText: response.statusText,
      latency,
      url
    };

  } catch (error) {
    const latency = Date.now() - startTime;

    return {
      isConnected: false,
      statusCode: null,
      statusText: error.message,
      latency,
      url,
      error: error.message
    };
  }
}

/**
 * Test internet connectivity (ping Google DNS)
 */
export async function testInternetConnection() {
  try {
    const response = await fetch('https://dns.google/dns-query?name=google.com&type=A', {
      method: 'GET',
      timeout: 5000
    });

    return response.ok;

  } catch (error) {
    return false;
  }
}

/**
 * Get connection status report
 * Returns status of Ollama and internet
 */
export async function getConnectionReport() {
  const [ollamaStatus, internetConnected] = await Promise.all([
    testOllamaConnection(),
    testInternetConnection()
  ]);

  return {
    ollama: ollamaStatus,
    internet: internetConnected,
    timestamp: new Date().toISOString()
  };
}

/**
 * Monitor connection status with periodic checks
 * Calls callback with status updates
 */
export function startConnectionMonitoring(callback, interval = 30000) {
  // Initial check
  testOllamaConnection().then(status => {
    callback(status);
  });

  // Periodic checks
  const intervalId = setInterval(async () => {
    const status = await testOllamaConnection();
    callback(status);
  }, interval);

  // Return function to stop monitoring
  return () => clearInterval(intervalId);
}

/**
 * Validate and test Ollama IP format before saving
 */
export async function validateAndTestOllamaIP(ip) {
  // Validate format
  if (!ip || typeof ip !== 'string') {
    return {
      isValid: false,
      error: 'Ollama IP is required'
    };
  }

  const trimmed = ip.trim();

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return {
      isValid: false,
      error: 'Must start with http:// or https://'
    };
  }

  if (!trimmed.includes(':') || !trimmed.includes('.')) {
    return {
      isValid: false,
      error: 'Invalid format. Example: http://192.168.1.5:11434'
    };
  }

  // Test the connection
  const testResult = await testURLConnection(`${trimmed}/api/tags`);

  if (!testResult.isConnected) {
    return {
      isValid: false,
      error: `Cannot connect: ${testResult.statusText}`,
      testResult
    };
  }

  return {
    isValid: true,
    testResult
  };
}

/**
 * Retry connection test with exponential backoff
 */
export async function retryConnectionTest(maxAttempts = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await testOllamaConnection();
      if (result.isConnected) {
        return result;
      }
      lastError = result.error;

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
      );

    } catch (error) {
      lastError = error.message;
    }
  }

  return {
    isConnected: false,
    error: lastError || 'All connection attempts failed',
    attempts: maxAttempts
  };
}
