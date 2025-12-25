import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useEffect } from 'react'
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
} from 'react-native'

import { registerDevice } from '../../src/services/device'
import { listServers } from '../../src/services/servers'
import { getDeviceId } from '../../src/storage/device'
import { getToken, setToken } from '../../src/storage/token'
import { colors } from '../../src/theme'

/**
 * Simple retry helper (VPN-safe)
 */
async function retry<T>(
  fn: () => Promise<T>,
  retries = 5,
  delayMs = 700,
): Promise<T> {
  let lastError
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
  throw lastError
}

export default function SplashScreen() {
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      // Absolute failsafe
      const splashTimeout = setTimeout(() => {
        if (!cancelled) {
          router.replace('/screens/ServersScreen')
        }
      }, 8000)

      try {
        const deviceId = await getDeviceId()

        // 🔐 Token-first (register ONLY once)
        let token = await getToken()
        if (!token) {
          const res = await retry(() =>
            registerDevice(deviceId, Platform.OS),
          )

          if (!res?.deviceToken) {
            throw new Error('deviceToken missing')
          }

          await setToken(res.deviceToken)
        }

        // 🌍 Fetch servers with retry (handles VPN DNS delay)
        const serversRes = await retry(() => listServers())
        const servers = serversRes?.data || serversRes || []

        if (!servers.length) {
          throw new Error('No servers available')
        }

        const defaultServer =
          servers.find(
            (s: any) => !s.isPremium && s.tier !== 'premium',
          ) || servers[0]

        clearTimeout(splashTimeout)

        if (!cancelled) {
          router.replace({
            pathname: '/screens/ConnectScreen',
            params: {
              server: JSON.stringify(defaultServer),
            },
          })
        }
      } catch (e) {
        clearTimeout(splashTimeout)
        if (!cancelled) {
          router.replace('/screens/ServersScreen')
        }
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <LinearGradient
      colors={['#050712', '#070B1D', '#0A1030']}
      style={styles.container}
    >
      <Text style={styles.logo}>SecureNest</Text>
      <Text style={styles.subtitle}>
        Establishing secure tunnel
      </Text>
      <ActivityIndicator size="large" color={colors.primary} />
    </LinearGradient>
  )
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
  },
})
