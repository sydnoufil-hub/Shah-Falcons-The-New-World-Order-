import { useState, useCallback, useEffect, useRef } from 'react';
import { testOllamaConnection, getConnectionReport, startConnectionMonitoring } from '../services/connectionTester';
import { getOllamaIP, setOllamaConnected as setConnectedInDB } from '../database/repositories/settingsRepository';

/**
 * useOllamaConnection Hook
 * Tracks and manages Ollama server connection status
 */
export function useOllamaConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [ollamaIP, setOllamaIP] = useState('http://192.168.1.5:11434');
  const [latency, setLatency] = useState(0);
  const [availableModels, setAvailableModels] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [connectionStatus, setConnectionStatus] = useState('unknown'); // 'connected', 'disconnected', 'unknown'
  const [lastChecked, setLastChecked] = useState(null);
  const [autoCheckInterval, setAutoCheckInterval] = useState(30000); // 30 seconds

  const monitoringRef = useRef(null);

  /**
   * Test connection to Ollama server
   */
  const testConnection = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await testOllamaConnection();

      if (result.isConnected) {
        setIsConnected(true);
        setConnectionStatus('connected');
        setLatency(result.latency || 0);
        setAvailableModels(result.models || 0);
      } else {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        setError(result.error || 'Failed to connect to Ollama');
      }

      setLastChecked(new Date().toISOString());

      return result;
    } catch (err) {
      console.error('Error testing Ollama connection:', err);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get detailed connection report
   */
  const getReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const report = await getConnectionReport();

      if (report.ollama.isConnected) {
        setIsConnected(true);
        setConnectionStatus('connected');
        setLatency(report.ollama.latency || 0);
      } else {
        setIsConnected(false);
        setConnectionStatus('disconnected');
      }

      setLastChecked(new Date().toISOString());

      return report;
    } catch (err) {
      console.error('Error getting connection report:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Start automatic connection monitoring
   */
  const startMonitoring = useCallback((interval = 30000) => {
    if (monitoringRef.current) {
      return; // Already monitoring
    }

    setAutoCheckInterval(interval);

    // Initial check
    testConnection();

    // Start periodic checks
    monitoringRef.current = setInterval(() => {
      testConnection();
    }, interval);
  }, [testConnection]);

  /**
   * Stop automatic connection monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (monitoringRef.current) {
      clearInterval(monitoringRef.current);
      monitoringRef.current = null;
    }
  }, []);

  /**
   * Retry connection with exponential backoff
   */
  const retryConnection = useCallback(async (maxAttempts = 3, backoffMs = 1000) => {
    let lastResult = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = await testConnection();

      if (result && result.isConnected) {
        return result;
      }

      lastResult = result;

      if (attempt < maxAttempts) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve =>
          setTimeout(resolve, backoffMs * Math.pow(2, attempt - 1))
        );
      }
    }

    return lastResult;
  }, [testConnection]);

  /**
   * Check if connection is available
   */
  const isAvailable = useCallback(() => {
    return isConnected && connectionStatus === 'connected';
  }, [isConnected, connectionStatus]);

  /**
   * Get connection quality indicator
   * 'excellent' (latency < 100ms), 'good' (< 500ms), 'poor' (>= 500ms)
   */
  const getQuality = useCallback(() => {
    if (!isConnected) return 'disconnected';
    if (latency < 100) return 'excellent';
    if (latency < 500) return 'good';
    return 'poor';
  }, [isConnected, latency]);

  /**
   * Get connection status message
   */
  const getStatusMessage = useCallback(() => {
    if (connectionStatus === 'connected') {
      return `Connected (${latency}ms)`;
    }
    if (connectionStatus === 'disconnected') {
      return `Disconnected${error ? `: ${error}` : ''}`;
    }
    return 'Checking...';
  }, [connectionStatus, latency, error]);

  /**
   * Auto-test on mount (non-blocking)
   */
  useEffect(() => {
    // Fire off connection test WITHOUT waiting for it
    // This prevents the UI from freezing
    testConnection().catch(err => {
      console.error('Background connection test failed:', err.message);
    });
  }, [testConnection]);

  /**
   * Cleanup monitoring on unmount
   */
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    // State
    isConnected,
    ollamaIP,
    latency,
    availableModels,
    connectionStatus,
    lastChecked,
    loading,
    error,

    // Core functions
    testConnection,
    getReport,
    retryConnection,
    startMonitoring,
    stopMonitoring,

    // Query functions
    isAvailable,
    getQuality,
    getStatusMessage
  };
}
