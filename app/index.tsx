import * as Notifications from 'expo-notifications';
import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function Index() {
  useEffect(() => {
    const initNotifications = async () => {
      if (Platform.OS === 'android') {
        await Notifications.requestPermissionsAsync();
      }
    };

    initNotifications();
  }, []);

  return <Redirect href="/screens/SplashScreen" />;
}
