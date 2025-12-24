import { router } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native'

import { registerDevice } from '../../src/services/device'
import { getDeviceId } from '../../src/storage/device'
import { setToken } from '../../src/storage/token'
import { colors } from '../../src/theme'

export default function SplashScreen() {
  useEffect(() => {
    const init = async () => {
      try {
        // ✅ REAL UUID (PERSISTENT)
        const deviceId = await getDeviceId()

        // ✅ REGISTER DEVICE
        const res = await registerDevice(deviceId, Platform.OS)

        if (!res?.deviceToken) {
          throw new Error('deviceToken missing in response')
        }

        // ✅ STORE TOKEN (30 DAYS)
        await setToken(res.deviceToken)

        // ✅ GO TO HOME
        router.replace('/screens/ConnectScreen')
      } catch (e: any) {
        console.log(
          '❌ Splash error',
          e?.response?.data || e.message,
        )
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
