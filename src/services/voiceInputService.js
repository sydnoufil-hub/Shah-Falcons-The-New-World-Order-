/**
 * Voice Input Service
 * Handles voice-to-text (speech recognition) and text-to-speech for the chatbot
 */

import * as Speech from 'expo-speech';
import * as SpeechRecognition from 'expo-speech-recognition';

const DEFAULT_LANGUAGE = 'en-US';
const VOICE_RATE = 1.0;
const VOICE_PITCH = 1.0;

/**
 * Check if speech recognition is available on device
 * @returns {Promise<boolean>}
 */
export async function isSpeechRecognitionAvailable() {
  try {
    const available = await SpeechRecognition.getAvailableLanguages();
    return available && available.length > 0;
  } catch (error) {
    console.warn('Speech recognition not available:', error.message);
    return false;
  }
}

/**
 * Check if text-to-speech is available on device
 * @returns {Promise<boolean>}
 */
export async function isTextToSpeechAvailable() {
  try {
    const voiceList = await Speech.getAvailableVoicesAsync();
    return voiceList && voiceList.length > 0;
  } catch (error) {
    console.warn('Text-to-speech not available:', error.message);
    return false;
  }
}

/**
 * Start voice recognition and return transcribed text
 * 
 * @param {object} options - Configuration options
 * @param {string} options.language - Language code (default: en-US)
 * @param {function} options.onPartialResult - Callback for partial results during listening
 * @param {function} options.onFinalResult - Callback for final result
 * @returns {Promise<string>} - Transcribed text
 */
export async function startVoiceInput(options = {}) {
  const {
    language = DEFAULT_LANGUAGE,
    onPartialResult = null,
    onFinalResult = null
  } = options;

  try {
    // Request permissions if needed
    const permissionGranted = await SpeechRecognition.requestPermissionsAsync();
    if (!permissionGranted.granted) {
      throw new Error('Microphone permission denied');
    }

    // Start listening
    SpeechRecognition.startListening({
      language,
      maxResults: 1,
      androidRecognitionServicePackage: 'com.google.android.gms',
      androidRecognitionNetworkRequired: true,
      androidRecognitionPrivilegesRequired: true
    });

    // Create promise that resolves when speech recognition completes
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Voice input timeout - no speech detected'));
      }, 30000); // 30 second timeout

      const subscription = SpeechRecognition.onResult(event => {
        const { isFinal, results } = event;

        if (results && results.length > 0) {
          const transcript = results[0];

          if (onPartialResult && !isFinal) {
            onPartialResult(transcript);
          }

          if (isFinal) {
            clearTimeout(timeout);
            subscription.remove();
            if (onFinalResult) {
              onFinalResult(transcript);
            }
            resolve(transcript);
          }
        }
      });

      // Handle errors
      const errorSubscription = SpeechRecognition.onError(event => {
        clearTimeout(timeout);
        subscription.remove();
        errorSubscription.remove();
        reject(new Error(`Speech recognition error: ${event.error}`));
      });
    });
  } catch (error) {
    console.error('Voice input error:', error);
    throw error;
  }
}

/**
 * Stop the current voice recognition session
 */
export function stopVoiceInput() {
  try {
    SpeechRecognition.stop();
  } catch (error) {
    console.warn('Error stopping voice input:', error.message);
  }
}

/**
 * Abort the current voice recognition session
 */
export function abortVoiceInput() {
  try {
    SpeechRecognition.abort();
  } catch (error) {
    console.warn('Error aborting voice input:', error.message);
  }
}

/**
 * Play text-to-speech for a given text
 * 
 * @param {string} text - Text to speak
 * @param {object} options - Configuration options
 * @param {string} options.language - Language code (default: en-US)
 * @param {number} options.rate - Speech rate 0.5-2.0 (default: 1.0)
 * @param {number} options.pitch - Pitch 0.5-2.0 (default: 1.0)
 * @param {number} options.volume - Volume 0.0-1.0 (default: 1.0)
 * @param {string} options.voice - Specific voice identifier (platform dependent)
 * @returns {Promise<void>}
 */
export async function speakText(text, options = {}) {
  const {
    language = DEFAULT_LANGUAGE,
    rate = VOICE_RATE,
    pitch = VOICE_PITCH,
    volume = 1.0,
    voice = undefined
  } = options;

  try {
    if (!text || text.trim().length === 0) {
      return;
    }

    await Speech.speak(text, {
      language,
      rate,
      pitch,
      volume,
      voice,
      onDone: () => {
        console.log('Text-to-speech completed');
      },
      onError: (error) => {
        console.error('Text-to-speech error:', error);
      }
    });
  } catch (error) {
    console.error('Speech synthesis error:', error);
    throw error;
  }
}

/**
 * Stop current text-to-speech playback
 */
export async function stopSpeaking() {
  try {
    await Speech.stop();
  } catch (error) {
    console.warn('Error stopping speech:', error.message);
  }
}

/**
 * Get list of available voices for the device
 * 
 * @returns {Promise<Array>} - Array of voice objects
 */
export async function getAvailableVoices() {
  try {
    return await Speech.getAvailableVoicesAsync();
  } catch (error) {
    console.error('Error getting available voices:', error);
    return [];
  }
}

/**
 * Get list of available languages for speech recognition
 * 
 * @returns {Promise<Array>} - Array of language codes
 */
export async function getAvailableLanguages() {
  try {
    return await SpeechRecognition.getAvailableLanguages();
  } catch (error) {
    console.error('Error getting available languages:', error);
    return [DEFAULT_LANGUAGE];
  }
}

/**
 * Check if device has active microphone permission
 * 
 * @returns {Promise<boolean>}
 */
export async function hasMicrophonePermission() {
  try {
    const result = await SpeechRecognition.getPermissionsAsync();
    return result.granted;
  } catch (error) {
    console.warn('Error checking microphone permission:', error.message);
    return false;
  }
}

/**
 * Request microphone permission
 * 
 * @returns {Promise<boolean>} - true if permission granted, false otherwise
 */
export async function requestMicrophonePermission() {
  try {
    const result = await SpeechRecognition.requestPermissionsAsync();
    return result.granted;
  } catch (error) {
    console.error('Error requesting microphone permission:', error);
    return false;
  }
}
