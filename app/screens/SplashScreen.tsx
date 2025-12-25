import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
} from 'react-native';

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
        // 1. Get unique Device ID
        const deviceId = await getDeviceId();

        // 2. Check if we already have a token
        let token = await getToken();
        
        // 3. Register device if no token exists
        if (!token) {
          console.log('📱 Registering new device...');
          const regRes = await registerDevice(deviceId, Platform.OS);
          if (regRes?.deviceToken) {
            await setToken(regRes.deviceToken);
          }
        }

        // 4. Fetch servers so we can pass a default one to ConnectScreen
        const serversRes = await listServers();
        const servers = serversRes?.data || serversRes || [];

        if (!isMounted) return;

        if (servers.length > 0) {
          // Found servers! Pick the first free one
          const defaultServer = servers.find((s: any) => !s.isPremium) || servers[0];
          
          // ✅ Move to ConnectScreen and "Kill" the Splash from history
          router.replace({
            pathname: '/screens/ConnectScreen',
            params: { server: JSON.stringify(defaultServer) },
          });
        } else {
          // No servers found in API, go to server list to retry
          router.replace('/screens/ServersScreen');
        }

      } catch (e) {
        console.error('❌ Splash Initialization Error:', e);
        if (isMounted) {
          // Failsafe: if API is down, go to ServersScreen so user can try to refresh
          router.replace('/screens/ServersScreen');
        }
      }
    };

    initializeApp();

    return () => { isMounted = false; };
  }, []);

  return (
    <LinearGradient
      colors={['#050712', '#070B1D', '#0A1030']}
      style={styles.container}
    >
      <Text style={styles.logo}>SecureNest</Text>
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
  logo: {
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