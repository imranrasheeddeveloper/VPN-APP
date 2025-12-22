import { useState } from 'react'
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { login } from '../services/auth'
import { setToken } from '../storage/token'

export default function LoginScreen({ route, navigation }: any) {
  const { device } = route.params
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onLogin = async () => {
    try {
      const res = await login(email, password)
      if (res?.token) await setToken(res.token)

      const plan = res?.user?.plan || 'free'
      navigation.replace('Servers', { device, plan })
    } catch (e: any) {
      Alert.alert('Login failed', 'Check email/password')
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Login</Text>

      <TextInput placeholder="Email" value={email} onChangeText={setEmail}
        autoCapitalize="none" style={{ borderWidth: 1, padding: 12, borderRadius: 10 }} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword}
        secureTextEntry style={{ borderWidth: 1, padding: 12, borderRadius: 10 }} />

      <TouchableOpacity style={{ padding: 14, backgroundColor: '#111', borderRadius: 10 }} onPress={onLogin}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>Login</Text>
      </TouchableOpacity>
    </View>
  )
}
