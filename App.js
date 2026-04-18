import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { initializeDatabase } from './src/database/db';
import { AppContextProvider } from './src/context/AppContext';

function AppContent() {
  return (
    <View style={styles.container}>
      <Text>Welcome to CashFlow!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    const initDB = async () => {
      try {
        await initializeDatabase();
        setDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setDbError(error.message);
      }
    };

    initDB();
  }, []);

  if (!dbInitialized) {
    return (
      <View style={styles.container}>
        {dbError ? (
          <Text style={{ color: 'red' }}>Database Error: {dbError}</Text>
        ) : (
          <>
            <ActivityIndicator size="large" color="#1E3A5F" />
            <Text>Initializing CashFlow...</Text>
          </>
        )}
      </View>
    );
  }

  return (
    <AppContextProvider>
      <AppContent />
    </AppContextProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
