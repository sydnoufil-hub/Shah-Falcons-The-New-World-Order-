import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch } from 'react-native';
import { AppContext } from '../context/AppContext';
import { COLORS } from '../constants/constants';

export default function SettingsScreen() {
  const { theme, setThemeState } = useContext(AppContext);
  const [darkMode, setDarkMode] = useState(theme === 'dark');

  const handleThemeChange = (value) => {
    setDarkMode(value);
    const newTheme = value ? 'dark' : 'light';
    // Save theme preference
    console.log('[Settings] Theme changed to:', newTheme);
  };

  const handleReset = () => {
    Alert.alert(
      "Reset App",
      "This will clear all your data. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset", 
          onPress: () => Alert.alert("Success", "Reset coming soon!"),
          style: "destructive"
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
      <Text style={styles.title}>Settings</Text>
      
      {/* AI Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🤖 AI Configuration</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Active AI Model</Text>
          <Text style={styles.infoValue}>Gemini 2.5 Flash</Text>
          <Text style={styles.infoDesc}>Cloud-powered AI, always available</Text>
        </View>
      </View>

      {/* App Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Preferences</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Switch 
            value={darkMode}
            onValueChange={handleThemeChange}
            trackColor={{ false: '#D3D3D3', true: '#81C784' }}
            thumbColor={darkMode ? '#27AE60' : '#FFF'}
          />
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ About</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>App Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Powered by</Text>
          <Text style={styles.infoValue}>Google Gemini API</Text>
        </View>
      </View>

      {/* Danger Zone */}
      <View style={styles.dangerSection}>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleReset}>
          <Text style={styles.dangerBtnText}>🗑️ Reset All Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA'
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 30, 
    marginTop: 20,
    marginHorizontal: 20,
    color: '#1E3A5F' 
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15
  },
  section: { 
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    elevation: 2
  },
  dangerSection: {
    marginHorizontal: 20,
    marginTop: 20
  },
  infoBox: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A5F'
  },
  infoDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 4
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50'
  },
  dangerBtn: {
    backgroundColor: '#E74C3C',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  dangerBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold'
  }
});