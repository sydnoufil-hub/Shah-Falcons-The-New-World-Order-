import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getBusinessProfile, updateBusinessProfile } from '../database/repositories/businessProfileRepository';
import { getOllamaIP, setOllamaIP, getTheme, setTheme, getLanguage, setLanguage, getCurrency } from '../database/repositories/settingsRepository';

/**
 * App Context
 * Global state for business profile, settings, and app-wide data
 */
export const AppContext = createContext();

/**
 * App Context Provider
 * Wraps the entire app to provide global state
 */
export function AppContextProvider({ children }) {
  // Business Profile State
  const [businessProfile, setBusinessProfile] = useState(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Settings State
  const [ollamaIP, setOllamaIPState] = useState('http://192.168.1.5:11434');
  const [theme, setThemeState] = useState('light');
  const [language, setLanguageState] = useState('en');
  const [currency, setCurrencyState] = useState('PKR');
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Connection Status
  const [isOllamaConnected, setIsOllamaConnected] = useState(false);

  /**
   * Load business profile on app start
   */
  useEffect(() => {
    loadBusinessProfile();
  }, []);

  /**
   * Load settings on app start
   */
  useEffect(() => {
    loadSettings();
  }, []);

  /**
   * Load business profile from database
   */
  const loadBusinessProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      const profile = await getBusinessProfile();

      if (profile) {
        setBusinessProfile(profile);
        setIsSetupComplete(profile.setupComplete);
      } else {
        setBusinessProfile(null);
        setIsSetupComplete(false);
      }
    } catch (error) {
      console.error('Error loading business profile:', error);
      setBusinessProfile(null);
      setIsSetupComplete(false);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  /**
   * Load settings from database
   */
  const loadSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);

      const [ip, themeVal, langVal, currencyVal] = await Promise.all([
        getOllamaIP(),
        getTheme(),
        getLanguage(),
        getCurrency()
      ]);

      setOllamaIPState(ip || 'http://192.168.1.5:11434');
      setThemeState(themeVal || 'light');
      setLanguageState(langVal || 'en');
      setCurrencyState(currencyVal || 'PKR');
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  /**
   * Update business profile
   */
  const updateProfile = useCallback(async (updates) => {
    try {
      const updated = await updateBusinessProfile(updates);
      setBusinessProfile(updated);

      if (updates.setupComplete !== undefined) {
        setIsSetupComplete(updates.setupComplete);
      }

      return updated;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }, []);

  /**
   * Update Ollama IP
   */
  const updateOllamaIP = useCallback(async (newIP) => {
    try {
      await setOllamaIP(newIP);
      setOllamaIPState(newIP);
    } catch (error) {
      console.error('Error updating Ollama IP:', error);
      throw error;
    }
  }, []);

  /**
   * Update theme
   */
  const updateTheme = useCallback(async (newTheme) => {
    try {
      await setTheme(newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Error updating theme:', error);
      throw error;
    }
  }, []);

  /**
   * Update language
   */
  const updateLanguage = useCallback(async (newLanguage) => {
    try {
      await setLanguage(newLanguage);
      setLanguageState(newLanguage);
    } catch (error) {
      console.error('Error updating language:', error);
      throw error;
    }
  }, []);

  /**
   * Update Ollama connection status
   */
  const updateOllamaConnected = useCallback((connected) => {
    setIsOllamaConnected(connected);
  }, []);

  const value = {
    // Business Profile
    businessProfile,
    isSetupComplete,
    profileLoading,
    updateProfile,

    // Settings
    ollamaIP,
    theme,
    language,
    currency,
    settingsLoading,
    updateOllamaIP,
    updateTheme,
    updateLanguage,

    // Connection
    isOllamaConnected,
    updateOllamaConnected,

    // Utilities
    loadBusinessProfile,
    loadSettings
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook to use App Context
 */
export function useAppContext() {
  const context = React.useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }

  return context;

  return context;
}
