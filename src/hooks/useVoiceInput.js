/**
 * Voice Input Hook
 * Manages voice recording, transcription, and text-to-speech state
 */

import { useState, useCallback, useEffect } from 'react';
import {
  startVoiceInput,
  stopVoiceInput,
  abortVoiceInput,
  speakText,
  stopSpeaking,
  isSpeechRecognitionAvailable,
  isTextToSpeechAvailable,
  hasMicrophonePermission,
  requestMicrophonePermission,
  getAvailableLanguages
} from '../services/voiceInputService';

/**
 * Hook for managing voice input and output
 * @returns {object} Voice control object
 */
export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [partialText, setPartialText] = useState('');
  const [error, setError] = useState(null);
  
  // Availability states
  const [voiceInputAvailable, setVoiceInputAvailable] = useState(false);
  const [textToSpeechAvailable, setTextToSpeechAvailable] = useState(false);
  const [microphonePermission, setMicrophonePermission] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState(['en-US']);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');

  // Check availability on mount
  useEffect(() => {
    checkAvailability();
    
    return () => {
      // Cleanup on unmount
      stopVoiceInput();
      stopSpeaking();
    };
  }, []);

  /**
   * Check voice input and TTS availability
   */
  const checkAvailability = useCallback(async () => {
    try {
      const [voiceAvailable, ttsAvailable, hasPermission, languages] = await Promise.allSettled([
        isSpeechRecognitionAvailable(),
        isTextToSpeechAvailable(),
        hasMicrophonePermission(),
        getAvailableLanguages()
      ]);

      setVoiceInputAvailable(voiceAvailable.status === 'fulfilled' ? voiceAvailable.value : false);
      setTextToSpeechAvailable(ttsAvailable.status === 'fulfilled' ? ttsAvailable.value : false);
      setMicrophonePermission(hasPermission.status === 'fulfilled' ? hasPermission.value : false);
      setAvailableLanguages(languages.status === 'fulfilled' ? languages.value : ['en-US']);
    } catch (err) {
      console.error('Error checking voice availability:', err);
    }
  }, []);

  /**
   * Request microphone permission
   */
  const requestPermission = useCallback(async () => {
    try {
      const granted = await requestMicrophonePermission();
      setMicrophonePermission(granted);
      return granted;
    } catch (err) {
      setError(`Permission error: ${err.message}`);
      return false;
    }
  }, []);

  /**
   * Start listening for voice input
   */
  const startListening = useCallback(async () => {
    try {
      setError(null);
      setTranscribedText('');
      setPartialText('');

      // Check permission first
      if (!microphonePermission) {
        const granted = await requestPermission();
        if (!granted) {
          setError('Microphone permission required');
          return;
        }
      }

      if (!voiceInputAvailable) {
        setError('Voice input not available on this device');
        return;
      }

      setIsListening(true);

      const result = await startVoiceInput({
        language: selectedLanguage,
        onPartialResult: (partial) => {
          setPartialText(partial);
        },
        onFinalResult: (final) => {
          setTranscribedText(final);
          setPartialText('');
        }
      });

      setIsListening(false);
      return result;
    } catch (err) {
      setIsListening(false);
      setError(err.message);
      console.error('Error starting voice input:', err);
    }
  }, [voiceInputAvailable, microphonePermission, selectedLanguage, requestPermission]);

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    try {
      stopVoiceInput();
      setIsListening(false);
    } catch (err) {
      setError(`Error stopping listening: ${err.message}`);
    }
  }, []);

  /**
   * Cancel listening
   */
  const cancelListening = useCallback(() => {
    try {
      abortVoiceInput();
      setIsListening(false);
      setPartialText('');
      setTranscribedText('');
    } catch (err) {
      setError(`Error cancelling listening: ${err.message}`);
    }
  }, []);

  /**
   * Play text as speech
   */
  const speak = useCallback(async (text, options = {}) => {
    try {
      setError(null);

      if (!textToSpeechAvailable) {
        setError('Text-to-speech not available on this device');
        return;
      }

      setIsSpeaking(true);

      const speechOptions = {
        ...options,
        language: options.language || selectedLanguage
      };

      await speakText(text, speechOptions);
      setIsSpeaking(false);
    } catch (err) {
      setIsSpeaking(false);
      setError(`TTS error: ${err.message}`);
      console.error('Error speaking text:', err);
    }
  }, [textToSpeechAvailable, selectedLanguage]);

  /**
   * Stop speaking
   */
  const stopSpeaking_ = useCallback(async () => {
    try {
      await stopSpeaking();
      setIsSpeaking(false);
    } catch (err) {
      setError(`Error stopping speech: ${err.message}`);
    }
  }, []);

  /**
   * Clear transcribed text
   */
  const clearTranscript = useCallback(() => {
    setTranscribedText('');
    setPartialText('');
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Change language
   */
  const changeLanguage = useCallback((language) => {
    if (availableLanguages.includes(language)) {
      setSelectedLanguage(language);
    } else {
      setError(`Language ${language} not available`);
    }
  }, [availableLanguages]);

  return {
    // State
    isListening,
    isSpeaking,
    transcribedText,
    partialText,
    error,
    voiceInputAvailable,
    textToSpeechAvailable,
    microphonePermission,
    selectedLanguage,
    availableLanguages,

    // Methods
    startListening,
    stopListening,
    cancelListening,
    speak,
    stopSpeaking: stopSpeaking_,
    clearTranscript,
    clearError,
    changeLanguage,
    requestPermission,
    checkAvailability
  };
}
