import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

let notificationsInitialized = false;

export const initNotificationSupport = async () => {
  if (!notificationsInitialized) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    notificationsInitialized = true;
  }

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;

  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 200, 200],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  return status === 'granted';
};

export const showLocalNotification = async ({ title, message, data = {} }) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title || 'WasteWise',
      body: message || 'You have a new update.',
      data,
    },
    trigger: null,
  });
};
