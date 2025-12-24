import { router } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { login } from '../../src/services/auth'
import { setToken } from '../../src/storage/token'
import { colors } from '../../src/theme'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = async () => {
    try {
      console.log('🔐 LOGIN ATTEMPT', { email })

      const res = await login(email, password)

      console.log('✅ LOGIN RESPONSE', res)

      if (!res?.token) {
        throw new Error('Token missing in response')
      }

      await setToken(res.token)

      router.replace('/screens/ServersScreen')
    } catch (err: any) {
      console.log('❌ LOGIN ERROR RAW:', err)

      // Axios / API error
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Unknown error'

      Alert.alert(
        'Login Failed',
        message,
        [{ text: 'OK' }],
      )
    }
  }


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.muted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.primary} onPress={submit}>
        <Text style={styles.btnText}>Login</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    color: colors.text,
    marginBottom: 12,
  },
  primary: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 18,
    marginTop: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
})
