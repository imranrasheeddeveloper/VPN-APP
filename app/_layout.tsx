import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import mobileAds from 'react-native-google-mobile-ads';
import 'react-native-reanimated';
import { interstitialManager } from '../src/ads/InterstitialManager';

const INTERSTITIAL_ID = 'ca-app-pub-1140863366083907/7191743581';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // 🔥 BOOT ADS HERE
  useEffect(() => {
    const bootAds = async () => {
      try {
        await mobileAds().initialize();
        interstitialManager.init(INTERSTITIAL_ID);
      } catch (e) {
        console.log('Ad init failed:', e);
      }
    };

    bootAds();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
