import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
} from 'react-native';

import splashLogo from '../../assets/images/splash-logo.png';
import { registerDevice } from '../../src/services/device';
import { listServers } from '../../src/services/servers';
import { getDeviceId } from '../../src/storage/device';
import { getToken, setToken } from '../../src/storage/token';
import { colors } from '../../src/theme';
export default function SplashScreen() {
  useEffect(() => {
    let isMounted = true;

    const initializeApp = async () => {
      try {
        const deviceId = await getDeviceId();
        let token = await getToken();

        if (!token) {
          console.log('📱 Registering new device...');
          const regRes = await registerDevice(deviceId, Platform.OS);
          if (regRes?.deviceToken) {
            await setToken(regRes.deviceToken);
          }
        }

        const serversRes = await listServers();
        const servers = serversRes?.data || serversRes || [];

        if (!isMounted) return;

        if (servers.length > 0) {
          const defaultServer =
            servers.find((s: any) => !s.isPremium) || servers[0];

          router.replace({
            pathname: '/screens/ConnectScreen',
            params: { server: JSON.stringify(defaultServer) },
          });
        } else {
          router.replace('/screens/ServersScreen');
        }
      } catch (e) {
        console.error('❌ Splash Initialization Error:', e);
        if (isMounted) {
          router.replace('/screens/ServersScreen');
        }
      }
    };

    initializeApp();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <LinearGradient
      colors={['#050712', '#070B1D', '#0A1030']}
      style={styles.container}
    >
      {/* ✅ App Logo */}
      <Image
      source={splashLogo}
      style={{ width: 120, height: 120 }}
      resizeMode="contain"
    />




      <Text style={styles.logoText}>SecureNest</Text>
      <Text style={styles.subtitle}>Securing your connection...</Text>
      <ActivityIndicator size="large" color={colors.primary} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },

  logoText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#EAF0FF',
    marginBottom: 6,
  },

  subtitle: {
    color: '#9AA6C3',
    marginBottom: 24,
    fontSize: 14,
  },
});
