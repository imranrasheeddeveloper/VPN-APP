import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  activeSessions,
  connectSession,
  disconnectSession,
} from '../../src/services/sessions';

import {
  connectVPN,
  disconnectVPN,
  prepareVPN,
} from '../../src/native/WireGuard';

import { colors } from '../../src/theme';

type Server = {
  id: number
  name: string
  country: string
}

export default function ConnectScreen() {
  // ✅ READ PARAMS AT TOP LEVEL
  const params = useLocalSearchParams<{
    server?: string
    plan?: string
  }>()

  // ✅ SAFE SERVER PARSING
  const server: Server | null = useMemo(() => {
    try {
      return params.server ? JSON.parse(params.server) : null
    } catch {
      return null
    }
  }, [params.server])

  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [sessionId, setSessionId] = useState<number | null>(null)

  // ✅ CHECK EXISTING SESSION ON LOAD
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await activeSessions()
        const list = res?.data || res || []

        if (list.length > 0) {
          setConnected(true)
          setSessionId(list[0].id) // 🔥 IMPORTANT
        }
      } catch (e) {
        console.log('❌ activeSessions error', e)
      } finally {
        setChecking(false)
      }
    }

    checkSession()
  }, [])

  

// Inside your ConnectScreen component...
useEffect(() => {
  // Listen for the "shout" from Android Kotlin
  const subscription = DeviceEventEmitter.addListener('VPN_STATUS_CHANGE', (status) => {
    console.log("VPN State changed to:", status);
    
    if (status === 'UP') {
      setConnected(true);
      setLoading(false);
    } else if (status === 'DOWN') {
      setConnected(false);
      setLoading(false);
    }
  });

  // Cleanup the listener when user leaves the screen
  return () => subscription.remove();
}, []);

  // ❌ NO SERVER → SAFE EXIT
  if (!server) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Invalid server data</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // 🔌 CONNECT (BACKEND + NATIVE WIREGUARD)
  const onConnect = async () => {
  setLoading(true);
  try {
    const isReady = await prepareVPN();
    if (!isReady) {
        setLoading(false);
        return; 
    }

    const res = await connectSession(server.id);
    
    // Safety Timeout: If no status change in 10 seconds, stop loading
    setTimeout(() => {
        setLoading(current => {
            if (current) Alert.alert("Connection Timeout", "Please try again.");
            return false;
        });
    }, 10000);

    await connectVPN(res.config);
  } catch (e: any) {
    setLoading(false);
    Alert.alert('Error', e.message);
  }
};

  // 🔌 DISCONNECT (NATIVE + BACKEND)
  const onDisconnect = async () => {
    if (!sessionId) {
      Alert.alert('Error', 'No active session found')
      return
    }

    setLoading(true)
    try {
      // 1️⃣ DISCONNECT NATIVE VPN
      await disconnectVPN()

      // 2️⃣ CLEAN BACKEND SESSION
      await disconnectSession(sessionId)

      setConnected(false)
      setSessionId(null)
    } catch (e: any) {
      Alert.alert(
        'Disconnect failed',
        e?.response?.data?.message ||
          e?.message ||
          'Unable to disconnect',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{server.name}</Text>
      <Text style={styles.country}>{server.country}</Text>

      <View style={[styles.ring, connected && styles.activeRing]}>
        {checking ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.status}>
            {connected ? 'CONNECTED' : 'DISCONNECTED'}
          </Text>
        )}
      </View>

      <TouchableOpacity
        disabled={loading || checking}
        style={[
          styles.button,
          connected ? styles.disconnect : styles.connect,
        ]}
        onPress={connected ? onDisconnect : onConnect}
      >
        <Text style={styles.btnText}>
          {loading
            ? 'Please wait…'
            : connected
            ? 'Disconnect'
            : 'Connect'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Change server</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  country: {
    color: colors.muted,
    marginBottom: 32,
  },
  ring: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 6,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  activeRing: {
    borderColor: '#22c55e',
  },
  status: {
    fontWeight: '800',
    color: colors.text,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginBottom: 20,
  },
  connect: {
    backgroundColor: colors.primary,
  },
  disconnect: {
    backgroundColor: colors.danger,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  back: {
    color: colors.muted,
    marginTop: 10,
  },
  error: {
    color: colors.danger,
    marginBottom: 12,
  },
})
