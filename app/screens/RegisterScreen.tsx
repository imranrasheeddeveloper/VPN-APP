import { useState } from 'react'
import {
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { register } from '../services/auth'
import { setToken } from '../storage/token'

export default function RegisterScreen({ route, navigation }: any) {
  const { device } = route.params

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const onRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required')
      return
    }

    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    setLoading(true)

    try {
      // 1️⃣ Register user
      await register(email, password)

      // 2️⃣ Auto-login after register
      const res = await registerAndLogin(email, password)

      if (res?.token) {
        await setToken(res.token)
      }

      const plan = res?.user?.plan || 'free'

      navigation.replace('Servers', {
        device,
        plan,
      })
    } catch (e: any) {
      Alert.alert(
        'Registration failed',
        e?.response?.data?.message || 'Unable to register',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: '700' }}>
        Create Account
      </Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          borderRadius: 10,
          padding: 12,
        }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{
          borderWidth: 1,
          borderRadius: 10,
          padding: 12,
        }}
      />

      <TextInput
        placeholder="Confirm Password"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
        style={{
          borderWidth: 1,
          borderRadius: 10,
          padding: 12,
        }}
      />

      <TouchableOpacity
        disabled={loading}
        onPress={onRegister}
        style={{
          padding: 14,
          backgroundColor: '#111',
          borderRadius: 10,
          opacity: loading ? 0.6 : 1,
        }}
      >
        <Text style={{ color: '#fff', textAlign: 'center' }}>
          {loading ? 'Creating account…' : 'Register'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ padding: 10 }}
      >
        <Text style={{ textAlign: 'center' }}>
          Already have an account? Login
        </Text>
      </TouchableOpacity>
    </View>
  )
}

/**
 * Helper: register → login flow
 * Backend already supports this pattern
 */
async function registerAndLogin(email: string, password: string) {
  const { login } = await import('../services/auth')
  return login(email, password)
}
