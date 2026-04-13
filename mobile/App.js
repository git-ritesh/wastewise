import React, { useEffect, useRef } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

import { store } from './src/redux/store';
import { loadUser } from './src/redux/authSlice';
import AppNavigator from './src/navigation/AppNavigator';
import { RealtimeProvider } from './src/context/RealtimeContext';
import { initNotificationSupport, registerNotificationResponseHandler } from './src/utils/notifications';

SplashScreen.preventAutoHideAsync();
const navigationRef = createNavigationContainerRef();

const Root = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const pendingRouteRef = useRef(null);
  let [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Inter_400Regular,
    Inter_500Medium,
  });

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  useEffect(() => {
    initNotificationSupport().catch((error) => {
      console.log('Notification init error:', error?.message || error);
    });
  }, []);

  useEffect(() => {
    const navigateFromNotification = (data = {}) => {
      if (!token) return;

      let target = { name: 'UserDashboard' };

      if (user?.role === 'admin') {
        target = { name: 'AdminDashboard' };
      } else if (user?.role === 'collector') {
        target = { name: 'CollectorDashboard' };
      } else {
        target = {
          name: 'Notifications',
          params: {
            fromPush: true,
            notificationId: data?.notificationId || null,
            relatedId: data?.relatedId || null,
            type: data?.type || null,
          },
        };
      }

      if (navigationRef.isReady()) {
        navigationRef.navigate(target.name, target.params);
      } else {
        pendingRouteRef.current = target;
      }
    };

    const subscription = registerNotificationResponseHandler(navigateFromNotification);
    return () => {
      subscription?.remove?.();
    };
  }, [token, user?.role]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <RealtimeProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            if (pendingRouteRef.current && navigationRef.isReady()) {
              const pending = pendingRouteRef.current;
              pendingRouteRef.current = null;
              navigationRef.navigate(pending.name, pending.params);
            }
          }}
        >
          <StatusBar style="dark" />
          <AppNavigator />
        </NavigationContainer>
      </RealtimeProvider>
    </SafeAreaProvider>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <Root />
    </Provider>
  );
}
