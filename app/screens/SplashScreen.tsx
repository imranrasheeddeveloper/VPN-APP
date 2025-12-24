import * as Application from 'expo-application'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native'

import { me } from '../../src/services/auth'
import { registerDevice } from '../../src/services/device'
import { setToken } from '../../src/storage/token'
import { colors } from '../../src/theme'

export default function SplashScreen() {
  useEffect(() => {
    const init = async () => {
      let deviceId = `${Platform.OS}-${Date.now()}`

      try {
        if (Platform.OS === 'ios') {
          const id = await Application.getIosIdForVendorAsync()
          if (id) deviceId = id
        }
      } catch {}

      try {
        const device = await registerDevice(deviceId, Platform.OS)
        if (device?.token) await setToken(device.token)

        try {
          const profile = await me()
          router.replace({
            pathname: '/screens/ServersScreen',
            params: { plan: profile.plan || 'free' },
          })
        } catch {
          router.replace('/screens/AuthChoiceScreen')
        }
      } catch {
        router.replace('/screens/AuthChoiceScreen')
      }
    }

    init()
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>SecureNest</Text>
      <Text style={styles.subtitle}>Establishing secure tunnel</Text>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    color: colors.muted,
    marginBottom: 24,
  },
})
