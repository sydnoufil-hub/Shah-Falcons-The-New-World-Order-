import React, { useState } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, Text, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useChatHistory, useVoiceInput, useTransactions } from '../../hooks';
import { chatWithGemini } from '../../services/geminiService';
import { extractAndSaveTransactions } from '../../services/transactionExtractor';
import { COLORS } from '../../constants/constants';

export default function ChatScreen() {
  const navigation = useNavigation();
  const { messages, addUserMessage, addAssistantMessage } = useChatHistory();
  const { isListening, transcribedText, partialText, startListening, stopListening, error: voiceError } = useVoiceInput();
  const { loadTransactions } = useTransactions();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Sync transcribed voice text to the input box
  React.useEffect(() => {
    if (transcribedText) setInputText(transcribedText);
  }, [transcribedText]);

  const handleSend = async () => {
    const message = inputText.trim();
    if (!message) return;

    setInputText('');
    await addUserMessage(message);
    setIsTyping(true);

    try {
      const aiResponse = await chatWithGemini(message);
      const { displayText, transactions } = await extractAndSaveTransactions(aiResponse);
      
      // Log saved transactions
      if (transactions.length > 0) {
        console.log(`[ChatScreen] Saved ${transactions.length} transaction(s) to database`);
        transactions.forEach(tx => {
          console.log(`  - ${tx.type}: PKR ${tx.amount} (${tx.category}) on ${tx.date}`);
        });
        
        // REFRESH dashboard/ledger/history by reloading transactions
        console.log('[ChatScreen] Refreshing transaction data...');
        await loadTransactions();
        console.log('[ChatScreen] Transaction data refreshed!');
      }
      
      // Show only the conversational text (without data block)
      await addAssistantMessage(displayText || aiResponse);
    } catch (err) {
      console.error('[ChatScreen] Error:', err);
      await addAssistantMessage("AI Error: " + err.message);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleVoice = () => {
    if (isListening) stopListening();
    else startListening();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CashFlow AI</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsBtn}>
            <Ionicons name="settings" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={item.role === 'user' ? styles.userText : styles.aiText}>{item.content}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 20 }}
      />
      {isTyping && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginBottom: 10 }} />}

      {voiceError && (
        <View style={{ backgroundColor: '#FFE8E8', padding: 12, marginHorizontal: 10, marginBottom: 10, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: COLORS.danger }}>
          <Text style={{ color: '#D32F2F', fontSize: 13, fontWeight: '500' }}>Voice Error: {voiceError}</Text>
          {voiceError.includes('development build') && (
            <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
              💡 Tip: Run{'\n'}
              <Text style={{ fontWeight: 'bold' }}>npx expo run:android</Text>
              {'\n'}to build with voice support
            </Text>
          )}
        </View>
      )}

      <View style={styles.inputArea}>
        <TouchableOpacity onPress={toggleVoice} style={styles.micBtn}>
          <Ionicons name={isListening ? "mic" : "mic-outline"} size={24} color={isListening ? COLORS.danger : COLORS.primary} />
        </TouchableOpacity>
        <TextInput 
          style={styles.input} 
          value={isListening ? partialText || 'Listening...' : inputText} 
          onChangeText={setInputText} 
          placeholder="Ask CashFlow..."
          editable={!isListening}
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
          <Ionicons name="send" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { backgroundColor: '#1E3A5F', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  settingsBtn: { padding: 8 },
  bubble: { marginVertical: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, maxWidth: '80%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#1E3A5F' },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#E8E8E8' },
  userText: { color: '#FFF', fontSize: 14 },
  aiText: { color: '#000', fontSize: 14 },
  inputArea: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: '#EEE' },
  input: { flex: 1, backgroundColor: '#F0F2F5', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, fontSize: 14 },
  micBtn: { marginRight: 10, padding: 8, backgroundColor: '#F0F2F5', borderRadius: 20 },
  sendBtn: { marginLeft: 10, backgroundColor: '#27AE60', padding: 12, borderRadius: 25, width: 45, height: 45, justifyContent: 'center', alignItems: 'center' }
});