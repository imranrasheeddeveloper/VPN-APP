import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  View,
} from 'react-native'

import {
  connectVPN,
  disconnectVPN,
  prepareVPN,
} from '../../src/native/WireGuard'
import {
  activeSessions,
  connectSession,
  disconnectSession,
} from '../../src/services/sessions'
import { colors } from '../../src/theme'

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

  /* ================= ANIMATIONS ================= */

  const pulse = useRef(new Animated.Value(0)).current
  const glow = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
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

  /* ================= CHECK EXISTING SESSION ================= */

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await activeSessions()
        const list = res?.data || res || []
        if (list.length > 0) {
          setConnected(true)
          setSessionId(list[0].id)
        }
      } catch (e) {
        console.log('❌ activeSessions error', e)
      } finally {
        setChecking(false)
      }
    }

    checkSession()
  }, [])

  /* ================= VPN STATUS LISTENER (ONLY ONE) ================= */

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'VPN_STATUS_CHANGE',
      (status) => {
        console.log('🔔 VPN STATUS:', status)

        if (status === 'UP') {
          setConnected(true)
          setLoading(false)
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          ).catch(() => {})
        }

        if (status === 'DOWN') {
          setConnected(false)
          setLoading(false)
          setSessionId(null)
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning
          ).catch(() => {})
        }
      }
    )

    return () => subscription.remove()
  }, [])

  /* ================= ANDROID BACK HANDLING ================= */

  useEffect(() => {
    const onBackPress = () => {
      if (loading) return true

      if (connected) {
        Alert.alert(
          'Disconnect?',
          'You are connected. Disconnect before leaving?',
          [
            { text: 'Stay', style: 'cancel' },
            {
              text: 'Disconnect',
              style: 'destructive',
              onPress: onDisconnect,
            },
          ]
        )
        return true
      }

      changeServer()
      return true
    }

    const sub = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    )
    return () => sub.remove()
  }, [connected, loading, sessionId])

  /* ================= CONNECT ================= */

  const onConnect = async () => {
    if (!server) return

    setLoading(true)
    Haptics.impactAsync(
      Haptics.ImpactFeedbackStyle.Medium
    ).catch(() => {})

    let timeout: ReturnType<typeof setTimeout> | null = null

    try {
      const isReady = await prepareVPN()
      if (!isReady) {
        setLoading(false)
        return
      }

      const res = await connectSession(server.id)

      // ✅ SAVE SESSION ID (CRITICAL)
      setSessionId(res.id)

      timeout = setTimeout(() => {
        setLoading((current) => {
          if (current) {
            Alert.alert('Connection Timeout', 'Please try again.')
          }
          return false
        })
      }, 10000)

      await connectVPN(res.config)
    } catch (e: any) {
      setLoading(false)
      Alert.alert(
        'Error',
        e?.response?.data?.message ||
          e?.message ||
          'Unable to connect'
      )
    } finally {
      if (timeout) clearTimeout(timeout)
    }
  }


  /* ================= DISCONNECT ================= */

  const onDisconnect = async () => {
    if (!sessionId) {
      Alert.alert('Error', 'No active session found')
      return
    }

    setLoading(true)
    Haptics.impactAsync(
      Haptics.ImpactFeedbackStyle.Light
    ).catch(() => {})

    try {
      await disconnectVPN()
      await disconnectSession(sessionId)

      setConnected(false)
      setSessionId(null)
    } catch (e: any) {
      Alert.alert(
        'Disconnect failed',
        e?.response?.data?.message ||
          e?.message ||
          'Unable to disconnect'
      )
    } finally {
      setLoading(false)
    }
  }

  /* ================= RENDER ================= */

  if (!server) {
    return (
      <LinearGradient
        colors={['#050712', '#070B1D', '#0A1030']}
        style={styles.container}
      >
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.hint}>Loading best server…</Text>
      </LinearGradient>
    )
  }

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  })
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.55],
  })
  const glowScale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  })

  return (
    <LinearGradient
      colors={['#050712', '#070B1D', '#0A1030']}
      style={styles.container}
    >
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Pressable onPress={changeServer} style={styles.topPill}>
          <Text style={styles.topPillText}>Change Server</Text>
        </Pressable>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={() => router.push('/screens/UpgradeScreen')}
            style={[styles.topPill, styles.premiumPill]}
          >
            <Text
              style={[
                styles.topPillText,
                { color: '#0B1224' },
              ]}
            >
              Premium
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/screens/LoginScreen')}
            style={styles.iconBtn}
          >
            <Text style={styles.iconBtnText}>👤</Text>
          </Pressable>
        </View>
      </View>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>{server.name}</Text>
        <Text style={styles.country}>{server.country}</Text>
      </View>

      {/* CORE */}
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale }, { scale: glowScale }],
              opacity: pulseOpacity,
            },
          ]}
        />
        <View
          style={[
            styles.coreRing,
            connected && styles.coreRingActive,
          ]}
        >
          {checking ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Text
                style={[
                  styles.status,
                  connected && styles.statusActive,
                ]}
              >
                {connected ? 'SECURE' : 'OFFLINE'}
              </Text>
              <Text style={styles.subStatus}>
                {connected
                  ? 'Tunnel established'
                  : 'Tap to connect'}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* ACTION */}
      <TouchableOpacity
        disabled={loading || checking}
        activeOpacity={0.85}
        style={[
          styles.actionBtn,
          connected ? styles.btnDisconnect : styles.btnConnect,
          (loading || checking) && { opacity: 0.75 },
        ]}
        onPress={connected ? onDisconnect : onConnect}
      >
        <Text style={styles.actionText}>
          {loading
            ? 'Please wait…'
            : connected
            ? 'Disconnect'
            : 'Connect'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.footerHint}>
        {Platform.OS === 'android'
          ? 'Back button: change server'
          : 'Swipe back: change server'}
      </Text>
    </LinearGradient>
  )
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18 },
  hint: {
    color: '#9AA6C3',
    textAlign: 'center',
    marginTop: 12,
  },

  topBar: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topPill: {
    borderWidth: 1,
    borderColor: 'rgba(120,140,255,0.25)',
    backgroundColor: 'rgba(10,16,48,0.55)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  premiumPill: {
    backgroundColor: '#FACC15',
    borderColor: 'rgba(250,204,21,0.35)',
  },
  topPillText: {
    color: '#EAF0FF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(10,16,48,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(120,140,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { fontSize: 16 },

  header: { marginTop: 26, alignItems: 'center' },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#EAF0FF',
    letterSpacing: 0.3,
  },
  country: { color: '#9AA6C3', marginTop: 6 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(120,140,255,0.35)',
  },
  coreRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: 'rgba(120,140,255,0.35)',
    backgroundColor: 'rgba(5,7,18,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreRingActive: {
    borderColor: 'rgba(34,197,94,0.6)',
  },
  status: {
    color: '#EAF0FF',
    fontWeight: '900',
    letterSpacing: 1.6,
    fontSize: 18,
  },
  statusActive: { color: '#22c55e' },
  subStatus: { color: '#9AA6C3', marginTop: 8 },

  actionBtn: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  btnConnect: { backgroundColor: colors.primary },
  btnDisconnect: { backgroundColor: colors.danger },
  actionText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.3,
  },

  footerHint: {
    textAlign: 'center',
    color: 'rgba(154,166,195,0.75)',
    marginBottom: 10,
    fontSize: 12,
  },
})
