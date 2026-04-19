import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/Navigator/AppNavigator';
import { initializeDatabase } from './src/database/db';
import { AppContextProvider } from './src/context/AppContext';
import { getBusinessProfile, initializeBusinessProfile } from './src/database/repositories/businessProfileRepository';

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    const initDB = async () => {
      try {
        console.log('[App] Starting database initialization...');
        await initializeDatabase();
        console.log('[App] Database initialization complete');
        
        // Initialize business profile if it doesn't exist
        try {
          const existingProfile = await getBusinessProfile();
          if (!existingProfile) {
            console.log('[App] Creating default business profile...');
            await initializeBusinessProfile({
              businessName: 'My Business',
              ownerName: '',
              openingBalance: 0,
              currency: 'PKR',
              setupComplete: false
            });
            console.log('[App] Default business profile created');
          }
        } catch (profileError) {
          console.warn('[App] Error initializing business profile:', profileError);
        }
        
        setDbInitialized(true);
      } catch (error) {
        console.error('[App] Failed to initialize database:', error);
        setDbError(error.message);
      }
    };

    initDB();
  }, []);

  if (!dbInitialized) {
    return (
      <View style={styles.container}>
        {dbError ? (
          <>
            <Text style={{ color: 'red', fontSize: 16, marginBottom: 10 }}>Database Error:</Text>
            <Text style={{ color: 'red', fontSize: 12 }}>{dbError}</Text>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color="#1E3A5F" />
            <Text style={{ marginTop: 10 }}>Initializing CashFlow...</Text>
          </>
        )}
      </View>
    );
  }

  return (
    <AppContextProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      <StatusBar style="auto" />
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
