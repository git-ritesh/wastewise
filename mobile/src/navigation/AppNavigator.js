import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { View, ActivityIndicator } from 'react-native';

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import OTPVerifyScreen from '../screens/Auth/OTPVerifyScreen';

// User Screens
import UserDashboard from '../screens/User/UserDashboard';
import MapScreen from '../screens/User/MapScreen';
import ReportGarbageScreen from '../screens/User/ReportGarbageScreen';
import NotificationScreen from '../screens/User/NotificationScreen';
import RewardScreen from '../screens/User/RewardScreen';

// Collector Screens
import CollectorDashboard from '../screens/Collector/CollectorDashboard';
import TaskDetailScreen from '../screens/Collector/TaskDetailScreen';

import { COLORS } from '../utils/constants';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, token, isLoading } = useSelector((state) => state.auth);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ 
      headerShown: false,
      headerTintColor: COLORS.text,
      headerStyle: { backgroundColor: '#fff', elevation: 0, shadowOpacity: 0 }
    }}>
      {token ? (
        user?.role === 'collector' ? (
          // Collector Routes
          <Stack.Group>
            <Stack.Screen name="CollectorDashboard" component={CollectorDashboard} />
            <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ headerShown: true, title: 'Task Details' }} />
          </Stack.Group>
        ) : (
          // User Routes
          <Stack.Group>
            <Stack.Screen name="UserDashboard" component={UserDashboard} />
            <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: true, title: 'Nearby Dustbins' }} />
            <Stack.Screen name="Report" component={ReportGarbageScreen} options={{ headerShown: true, title: 'Report Garbage' }} />
            <Stack.Screen name="Notifications" component={NotificationScreen} options={{ headerShown: true, title: 'Notifications' }} />
            <Stack.Screen name="Rewards" component={RewardScreen} options={{ headerShown: true, title: 'My Rewards' }} />
          </Stack.Group>
        )
      ) : (
        // Auth Stack
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
