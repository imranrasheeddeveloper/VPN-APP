import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  DeviceEventEmitter,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { useVpnHeartbeat } from '../../src/hooks/useVpnHeartbeat';
import {
  connectVPN,
  disconnectVPN,
  getVpnStatus,
  prepareVPN,
  startVpnStats,
  stopVpnStats
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
  countryCode: string;
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
  const { isLoggedIn, email, plan } = useAuth()
  const [stats, setStats] = useState({ down: 0, up: 0 });
  const initRef = useRef(false);
  const isUserConnectingRef = useRef(false);


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

  // EFFECT 1: Control the Native Timer
  useEffect(() => {
    if (connected) {
      startVpnStats();
    } else {
      stopVpnStats();
    }
    // No return cleanup here that calls stopVpnStats() 
    // to avoid killing the process during state transitions
  }, [connected]);

  // EFFECT 2: The Listener (Always ON)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('VPN_STATS', (data) => {
      setStats({
        down: data.down / 1024,
        up: data.up / 1024
      });
    });
    return () => {
        sub.remove();
        stopVpnStats(); // Only stop when the whole screen is closed
    };
  }, []);


  // useEffect(() => {
  //   if (!server) router.push('/screens/ServersScreen')
  // }, [server])

  /* ================= INITIALIZATION LOGIC ================= */
  useEffect(() => {
  if (initRef.current) return;
  initRef.current = true;

  const initializeVpnState = async () => {
    try {
      setChecking(true);

      const [vpnStatus, res] = await Promise.all([
        getVpnStatus(),
        activeSessions().catch(() => null),
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
      else if (
        vpnStatus === 'DOWN' &&
        hasApiSession &&
        !isUserConnectingRef.current // ✅ BLOCK RACE
      ) {
        await disconnectSession(sessions[0].id).catch(() => {});
        setConnected(false);
        setSessionId(null);
      }
      else {
        setConnected(false);
        setSessionId(null);
      }
    } catch (e: any) {
      isUserConnectingRef.current = false; // ✅ ADD
      setLoading(false);
      Alert.alert('Error', e?.message || 'Unable to connect');
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
        console.log('🔔 VPN STATUS EVENT:', status);

        // 🔒 Ignore DOWN events while user is connecting
        if (status === 'DOWN' && isUserConnectingRef.current) {
          console.log('⏳ Ignoring DOWN during connect');
          return;
        }

        if (status === 'UP') {
          isUserConnectingRef.current = false;
          setConnected(true);
          setLoading(false);
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          ).catch(() => {});
        }

        if (status === 'DOWN') {
          isUserConnectingRef.current = false;
          setConnected(false);
          setLoading(false);
          setSessionId(null);
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning
          ).catch(() => {});
        }
      }
    );

    return () => subscription.remove();
  }, []);


 
  /* ================= CONNECT ACTION ================= */
  const onConnect = async () => {
    if (!server) return;
    isUserConnectingRef.current = true;
    setLoading(true);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      // 1. Ensure any old instance is fully killed first
      if (connected) {
        await disconnectVPN().catch(() => {});
      }
      
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
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (loading) return true;

        if (connected) {
          Alert.alert(
            'Disconnect?',
            'Close VPN before leaving?',
            [
              { text: 'Stay', style: 'cancel' },
              {
                text: 'Disconnect',
                style: 'destructive',
                onPress: onDisconnect,
              },
            ]
          );
          return true; // block exit
        }

        return false; // allow system back
      };

      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => sub.remove(); // 🔥 removed when screen loses focus
    }, [connected, loading])
  );




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
          {/* LEFT: Account */}
          <Pressable
            onPress={() =>
              router.push(isLoggedIn ? '/screens/ProfileScreen' : '/screens/LoginScreen')
            }
            style={styles.accountChip}
          >
            <Feather
              name="user"
              size={14}
              color={isLoggedIn ? '#EAF0FF' : '#9AA6C3'}
            />
            <View>
              <Text style={styles.accountTitle}>
                {isLoggedIn ? 'Account' : 'Sign in'}
              </Text>
              <Text style={styles.accountSub}>
                {isLoggedIn ? 'View profile' : 'Access premium features'}
              </Text>
            </View>
          </Pressable>


          {/* RIGHT: Subscription */}
          {plan === 'premium' ? (
            <View style={styles.proActive}>
              <Feather name="shield" size={12} color="#22c55e" />
              <Text style={styles.proActiveText}>Premium Active</Text>
            </View>
          ) : (
            <Pressable
              onPress={() => router.push('/screens/UpgradeScreen')}
              style={styles.proButton}
            >
              <Feather name="zap" size={12} color="#0B1224" />
              <Text style={styles.proText}>Upgrade</Text>
            </Pressable>
          )}
        </View>

      <View style={styles.header}>
        <Text style={styles.country}>
            {getFlagEmoji(server.countryCode)} {server.country}
          </Text>
        <Text style={styles.title}>{server.name}</Text>
        
        {/* Change Server */}
        <Pressable
          onPress={changeServer}
          style={styles.changeServerRow}
        >
          <Feather name="repeat" size={14} color="#9AA6C3" />
          <Text style={styles.changeServerText}>Change server</Text>
        </Pressable>
        {connected && (
          <View style={styles.statsRow}>
            <Text style={styles.statText}>⬇ {stats.down.toFixed(1)} KB/s</Text>
            <Text style={styles.statText}>⬆ {stats.up.toFixed(1)} KB/s</Text>
          </View>
        )}
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

  function getFlagEmoji(countryCode: string) {
    if (!countryCode) return '🏳️';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }

}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18 },
  topPill: { borderWidth: 1, borderColor: 'rgba(120,140,255,0.25)', backgroundColor: 'rgba(10,16,48,0.55)', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999 },
  premiumPill: { backgroundColor: '#FACC15', borderColor: 'rgba(250,204,21,0.35)' },
  topPillText: { color: '#EAF0FF', fontWeight: '800', fontSize: 12, letterSpacing: 0.3 },
  header: { marginTop: 26, alignItems: 'center' },
  country: { fontSize: 28, fontWeight: '900', color: '#EAF0FF', letterSpacing: 0.3 },
  title: { color: '#9AA6C3', marginTop: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(120,140,255,0.35)' },
  coreRing: { width: 220, height: 220, borderRadius: 110, borderWidth: 2, borderColor: 'rgba(120,140,255,0.35)', backgroundColor: 'rgba(5,7,18,0.65)', alignItems: 'center', justifyContent: 'center' },
  coreRingActive: { borderColor: 'rgba(34,197,94,0.6)' },
  status: { color: '#EAF0FF', fontWeight: '900', letterSpacing: 1.6, fontSize: 18 },
  statusActive: { color: '#22c55e' },
  subStatus: { color: '#9AA6C3', marginTop: 8 },
  actionBtn: { paddingVertical: 16, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 50 },
  btnConnect: { backgroundColor: colors.primary },
  btnDisconnect: { backgroundColor: colors.danger },
  actionText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.3 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 15,
    backgroundColor: 'rgba(120,140,255,0.05)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'center',
  },
  statText: {
    color: '#9AA6C3',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // Monospace looks better for numbers
  },
  topBar: {
  marginTop: 12,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},

/* ===== Identity ===== */
identity: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
},

avatar: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: 'rgba(120,140,255,0.2)',
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
  borderColor: 'rgba(120,140,255,0.4)',
},

avatarText: {
  color: '#EAF0FF',
  fontWeight: '900',
},

identityName: {
  color: '#EAF0FF',
  fontWeight: '700',
  fontSize: 13,
  maxWidth: 120,
},

identitySub: {
  color: '#9AA6C3',
  fontSize: 10,
  marginTop: -2,
},

/* ===== Server Chip ===== */
serverChip: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  paddingVertical: 8,
  paddingHorizontal: 14,
  borderRadius: 999,
  backgroundColor: 'rgba(10,16,48,0.65)',
  borderWidth: 1,
  borderColor: 'rgba(120,140,255,0.25)',
},

serverChipText: {
  color: '#EAF0FF',
  fontWeight: '800',
  fontSize: 12,
},

/* ===== PRO ===== */
proButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  backgroundColor: '#FACC15',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 999,
},

proText: {
  color: '#0B1224',
  fontWeight: '900',
  fontSize: 12,
},

proActive: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  paddingVertical: 8,
  paddingHorizontal: 12,
},

proActiveText: {
  color: '#22c55e',
  fontWeight: '800',
  fontSize: 12,
},
changeServerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginTop: 12,
  paddingVertical: 6,
  paddingHorizontal: 14,
  borderRadius: 999,
  backgroundColor: 'rgba(120,140,255,0.08)',
},

changeServerText: {
  color: '#9AA6C3',
  fontSize: 12,
  fontWeight: '700',
},
accountChip: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 12,
  backgroundColor: 'rgba(120,140,255,0.08)',
},

accountTitle: {
  color: '#EAF0FF',
  fontWeight: '800',
  fontSize: 12,
},

accountSub: {
  color: '#9AA6C3',
  fontSize: 10,
  marginTop: -2,
},

});