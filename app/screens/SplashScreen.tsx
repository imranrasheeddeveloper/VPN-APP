import * as Application from 'expo-application'
import { useEffect } from 'react'
import { Platform, Text, View } from 'react-native'
import { me } from '../services/auth'
import { registerDevice } from '../services/device'
import { setToken } from '../storage/token'

export default function SplashScreen({ navigation }: any) {
  useEffect(() => {
    const init = async () => {
      // 1️⃣ Generate device ID
      let deviceId = `${Platform.OS}-${Date.now()}`
      try {
        if (Platform.OS === 'ios') {
          const id = await Application.getIosIdForVendorAsync()
          if (id) deviceId = id
        }
      } catch {}

      // 2️⃣ Register device → GET JWT
      const deviceRes = await registerDevice(deviceId, Platform.OS)

      if (deviceRes?.token) {
        await setToken(deviceRes.token)
      }

      // 3️⃣ Try loading profile (works for free + premium)
      try {
        const profile = await me()
        navigation.replace('Servers', {
          device: deviceRes,
          plan: profile.plan || 'free',
        })
      } catch {
        navigation.replace('Servers', {
          device: deviceRes,
          plan: 'free',
        })
      }
    }

    init()
  }, [])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 26, fontWeight: '700' }}>SecureNest VPN</Text>
      <Text>Initializing secure connection…</Text>
    </View>
  )
}
