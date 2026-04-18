import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { COLORS } from '../constants/constants';
import DashboardScreen from '../screens/DashboardScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import TransactionsScreen from '../screens/Transaction/TransactionsScreen';
import LedgerScreen from '../screens/LedgerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OnboardingScreen from '../screens/OnboardScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = route.name === 'Dashboard' ? 'stats-chart' : 
                         route.name === 'Chat' ? 'chatbubble-ellipses' :
                         route.name === 'Ledger' ? 'book' : 
                         route.name === 'History' ? 'list' : 'settings';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.secondary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: { height: 60, paddingBottom: 10 }
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Ledger" component={LedgerScreen} />
      <Tab.Screen name="History" component={TransactionsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isSetupComplete, profileLoading } = useContext(AppContext);

  if (profileLoading) return null; // Or return a Splash Screen

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isSetupComplete ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}