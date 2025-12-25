import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  DeviceEventEmitter,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { useVpnHeartbeat } from '../../src/hooks/useVpnHeartbeat';
import {
  connectVPN,
  disconnectVPN,
  getVpnStatus,
  prepareVPN
} from '../../src/native/WireGuard';
import {
  activeSessions,
  connectSession,
  disconnectSession,
} from '../../src/services/sessions';
import { colors } from '../../src/theme';

type Server = {
  id: number
  name: string
  country: string
  isPremium?: boolean
  tier?: string
}

export default function ConnectScreen() {
  const params = useLocalSearchParams<{ server?: string }>()
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
  
  useVpnHeartbeat(connected, sessionId);

  /* ================= ANIMATIONS ================= */
  const pulse = useRef(new Animated.Value(0)).current
  const glow = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  useEffect(() => {
    Animated.timing(glow, {
      toValue: connected ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start()
  }, [connected, glow])

  /* ================= NAVIGATION ================= */
  const changeServer = () => {
    router.push('/screens/ServersScreen')
  }

  useEffect(() => {
    if (!server) router.replace('/screens/ServersScreen')
  }, [server])

  /* ================= INITIALIZATION LOGIC ================= */
  useEffect(() => {
    const initializeVpnState = async () => {
      try {
        setChecking(true);
        const [vpnStatus, res] = await Promise.all([
          getVpnStatus(),
          activeSessions().catch(() => null)
        ]);

        const sessions = res?.data || res || [];
        const hasApiSession = sessions.length > 0;

        console.log('🔍 Initial Sync:', { vpnStatus, hasApiSession });

        if (vpnStatus === 'UP' && hasApiSession) {
          setConnected(true);
          setSessionId(sessions[0].id);
        } 
        else if (vpnStatus === 'UP' && !hasApiSession) {
          await disconnectVPN();
          setConnected(false);
        } 
        else if (vpnStatus === 'DOWN' && hasApiSession) {
          // Clean up stale backend session if VPN is down
          await disconnectSession(sessions[0].id).catch(() => {});
          setConnected(false);
          setSessionId(null);
        } else {
          setConnected(false);
          setSessionId(null);
        }
      } catch (e) {
        console.log('❌ Init Error:', e);
      } finally {
        setChecking(false);
      }
    };

    initializeVpnState();
  }, []);

  /* ================= VPN EVENT LISTENER ================= */
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'VPN_STATUS_CHANGE',
      (status) => {
        console.log('🔔 VPN STATUS EVENT:', status)
        if (status === 'UP') {
          setConnected(true)
          setLoading(false)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
        }
        if (status === 'DOWN') {
          setConnected(false)
          setLoading(false)
          setSessionId(null)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
        }
      }
    )
    return () => subscription.remove()
  }, [])

  /* ================= CONNECT ACTION ================= */
  const onConnect = async () => {
    if (!server) return;
    setLoading(true);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      // 1. Ensure any old instance is fully killed first
      await disconnectVPN().catch(() => {});
      
      // 2. Request Android Permission
      const isReady = await prepareVPN();
      if (!isReady) {
        setLoading(false);
        return;
      }

      // 3. Start Backend Session
      const res = await connectSession(server.id);
      console.log('✅ API SESSION STARTED:', res.sessionId);
      setSessionId(res.sessionId);

      // 4. CRITICAL: Small delay to ensure Android Service intent is ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // 5. Start Native Tunnel
      await connectVPN(res.config);

      // Timeout safety: if no 'UP' event in 12 seconds
      setTimeout(() => {
        setLoading(current => {
          if (current) {
            Alert.alert('Connection Timeout', 'The server is not responding. Please try again.');
            return false;
          }
          return current;
        });
      }, 12000);

    } catch (e: any) {
      setLoading(false);
      Alert.alert('Error', e?.message || 'Unable to connect');
    }
  }

  /* ================= DISCONNECT ACTION ================= */
  const onDisconnect = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    try {
      await disconnectVPN();
      if (sessionId) {
        await disconnectSession(sessionId).catch(() => {});
      }
      setConnected(false);
      setSessionId(null);
    } catch (e: any) {
      Alert.alert('Disconnect Error', 'Failed to close connection safely');
    } finally {
      setLoading(false);
    }
  }

  /* ================= ANDROID BACK BUTTON ================= */
  useEffect(() => {
    const onBackPress = () => {
      if (loading) return true;
      if (connected) {
        Alert.alert('Disconnect?', 'Close VPN before leaving?', [
          { text: 'Stay', style: 'cancel' },
          { text: 'Disconnect', style: 'destructive', onPress: onDisconnect },
        ]);
        return true;
      }
      changeServer();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [connected, loading, sessionId]);

  /* ================= RENDER ================= */
  if (!server) {
    return (
      <LinearGradient colors={['#050712', '#070B1D', '#0A1030']} style={styles.container}>
        <ActivityIndicator color={colors.primary} />
      </LinearGradient>
    );
  }

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  return (
    <LinearGradient colors={['#050712', '#070B1D', '#0A1030']} style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={changeServer} style={styles.topPill}>
          <Text style={styles.topPillText}>Change Server</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/screens/UpgradeScreen')} style={[styles.topPill, styles.premiumPill]}>
          <Text style={[styles.topPillText, { color: '#0B1224' }]}>Premium</Text>
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>{server.name}</Text>
        <Text style={styles.country}>{server.country}</Text>
      </View>

      <View style={styles.center}>
        <Animated.View style={[styles.pulseRing, { transform: [{ scale }, { scale: glowScale }], opacity: pulseOpacity }]} />
        <View style={[styles.coreRing, connected && styles.coreRingActive]}>
          {checking ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Text style={[styles.status, connected && styles.statusActive]}>
                {connected ? 'SECURE' : 'OFFLINE'}
              </Text>
              <Text style={styles.subStatus}>{connected ? 'Tunnel established' : 'Tap to connect'}</Text>
            </>
          )}
        </View>
      </View>

      <TouchableOpacity
        disabled={loading || checking}
        activeOpacity={0.85}
        style={[styles.actionBtn, connected ? styles.btnDisconnect : styles.btnConnect, (loading || checking) && { opacity: 0.7 }]}
        onPress={connected ? onDisconnect : onConnect}
      >
        <Text style={styles.actionText}>{loading ? 'Establishing...' : connected ? 'Disconnect' : 'Connect'}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18 },
  topBar: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topPill: { borderWidth: 1, borderColor: 'rgba(120,140,255,0.25)', backgroundColor: 'rgba(10,16,48,0.55)', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999 },
  premiumPill: { backgroundColor: '#FACC15', borderColor: 'rgba(250,204,21,0.35)' },
  topPillText: { color: '#EAF0FF', fontWeight: '800', fontSize: 12, letterSpacing: 0.3 },
  header: { marginTop: 26, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#EAF0FF', letterSpacing: 0.3 },
  country: { color: '#9AA6C3', marginTop: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(120,140,255,0.35)' },
  coreRing: { width: 220, height: 220, borderRadius: 110, borderWidth: 2, borderColor: 'rgba(120,140,255,0.35)', backgroundColor: 'rgba(5,7,18,0.65)', alignItems: 'center', justifyContent: 'center' },
  coreRingActive: { borderColor: 'rgba(34,197,94,0.6)' },
  status: { color: '#EAF0FF', fontWeight: '900', letterSpacing: 1.6, fontSize: 18 },
  statusActive: { color: '#22c55e' },
  subStatus: { color: '#9AA6C3', marginTop: 8 },
  actionBtn: { paddingVertical: 16, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  btnConnect: { backgroundColor: colors.primary },
  btnDisconnect: { backgroundColor: colors.danger },
  actionText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.3 },
});