import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { AppContext } from '../context/AppContext';
import { COLORS } from '../constants/constants';

export default function OnboardingScreen() {
  const { updateProfile } = useContext(AppContext);
  const [businessName, setBusinessName] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');

  const handleCompleteSetup = async () => {
    if (!businessName.trim() || !openingBalance.trim()) return;

    await updateProfile({
      businessName,
      openingBalance: parseFloat(openingBalance) || 0,
      currency: 'PKR',
      setupComplete: true, // This flag will switch the navigator to MainTabs
      lastMonthlyCheckIn: new Date().toISOString()
    });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Text style={styles.title}>Welcome to CashFlow</Text>
      <Text style={styles.subtitle}>Let's set up your business profile.</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. My Retail Shop" 
          value={businessName}
          onChangeText={setBusinessName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Starting Cash Balance (PKR)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="0" 
          keyboardType="numeric"
          value={openingBalance}
          onChangeText={setOpeningBalance}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCompleteSetup}>
        <Text style={styles.buttonText}>Start Tracking</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', justifyContent: 'center', padding: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1E3A5F', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#7F8C8D', marginBottom: 40 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#2C3E50', marginBottom: 8 },
  input: { backgroundColor: '#F4F7F9', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  button: { backgroundColor: '#27AE60', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});