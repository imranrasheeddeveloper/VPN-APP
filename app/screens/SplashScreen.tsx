import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, Platform, StyleSheet, Text } from 'react-native'

import { registerDevice } from '../../src/services/device'
import { listServers } from '../../src/services/servers'
import { getDeviceId } from '../../src/storage/device'
import { setToken } from '../../src/storage/token'
import { colors } from '../../src/theme'

export default function SplashScreen() {
  useEffect(() => {
    const init = async () => {
      try {
        const deviceId = await getDeviceId()

        const res = await registerDevice(deviceId, Platform.OS)
        if (!res?.deviceToken) throw new Error('deviceToken missing in response')

        await setToken(res.deviceToken)

        const serversRes = await listServers()
        const servers = serversRes?.data || serversRes || []
        if (!servers.length) throw new Error('No servers available')

        const defaultServer =
          servers.find((s: any) => !s.isPremium && s.tier !== 'premium') || servers[0]

        router.replace({
          pathname: '/screens/ConnectScreen',
          params: { server: JSON.stringify(defaultServer) },
        })
      } catch (e: any) {
        console.log('❌ Splash error', e?.response?.data || e.message)
        // If anything fails, send user to server list so they aren’t stuck.
        router.replace('/screens/ServersScreen')
      }
    }

    init()
  }, [])

  return (
    <LinearGradient colors={['#050712', '#070B1D', '#0A1030']} style={styles.container}>
      <Text style={styles.logo}>SecureNest</Text>
      <Text style={styles.subtitle}>Establishing secure tunnel</Text>
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
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#9AA6C3',
    marginBottom: 24,
  },
})
