import { registerForPushNotifications } from '@/src/utlis/registerPush';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text
} from 'react-native';
import splashLogo from '../../assets/images/splash-logo.png';
import { registerDevice, registerDevicePushToken } from '../../src/services/device';
import { listServers } from '../../src/services/servers';
import { getDeviceId } from '../../src/storage/device';
import { getToken, setToken } from '../../src/storage/token';
import { colors } from '../../src/theme';
export default function SplashScreen() {
  
  useEffect(() => {
    let isMounted = true;

    const pause = (title: string, message: string) =>
      new Promise<void>((resolve) => {
        Alert.alert(title, message || 'EMPTY', [
          { text: 'OK', onPress: () => resolve() },
        ]);
      });

    const initializeApp = async () => {
      try {
        // 🔥 allow native modules to be ready
        await new Promise((r) => setTimeout(r, 0));

        const deviceId = await getDeviceId();


        // 1️⃣ Token before anything
        let token = await getToken();
       // await pause('TOKEN (before register)', token || 'NO TOKEN');

        // 2️⃣ Register device if no token
        if (!token) {
          const regRes = await registerDevice(deviceId, Platform.OS);
          // await pause(
          //   'REGISTER DEVICE RESPONSE',
          //   JSON.stringify(regRes, null, 2)
          // );

          if (regRes?.deviceToken) {
            await setToken(regRes.deviceToken);
          }
        }

        // 3️⃣ Token after register
        token = await getToken();
       // await pause('TOKEN (after register)', token || 'STILL NO TOKEN');

        // 4️⃣ Push token
        const pushToken = await registerForPushNotifications();
        //await pause('PUSH TOKEN', pushToken || 'NO PUSH TOKEN');

        if (pushToken) {
          await registerDevicePushToken(pushToken);
        }

        // 5️⃣ Servers API
        let servers: any[] = [];
        try {
          servers = await listServers();
         // await pause(
            //'SERVERS RESPONSE',
          //  JSON.stringify(servers, null, 2)
        //  );
        } catch (e: any) {
          await pause(
            'SERVERS API ERROR',
            JSON.stringify(
              {
                status: e?.response?.status,
                data: e?.response?.data,
              },
              null,
              2
            )
          );
        }

        // ⏸ Final pause before navigation
       // await pause(
       //   'FINAL STATE',
       //   `Token: ${token}\nServers count: ${servers.length}`
      //  );

        if (!isMounted) return;

        if (servers.length > 0) {
          router.replace({
            pathname: '/screens/ConnectScreen',
            params: { server: JSON.stringify(servers[0]) },
          });
        } else {
          router.replace('/screens/ServersScreen');
        }
      } catch (e: any) {
        await pause(
          'SPLASH CRASH',
          e?.message || JSON.stringify(e)
        );
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
