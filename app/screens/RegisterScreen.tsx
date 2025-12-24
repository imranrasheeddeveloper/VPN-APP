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
import { login, register } from '../../src/services/auth'
import { setToken } from '../../src/storage/token'
import { colors } from '../../src/theme'

export default function RegisterScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const submit = async () => {
    if (password !== confirm) {
      Alert.alert('Passwords do not match')
      return
    }

    try {
      await register(email, password)
      const res = await login(email, password)
      if (res?.token) await setToken(res.token)
      router.replace('/screens/ServersScreen')
    } catch {
      Alert.alert('Registration failed')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.muted} secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor={colors.muted} secureTextEntry value={confirm} onChangeText={setConfirm} />

      <TouchableOpacity style={styles.primary} onPress={submit}>
        <Text style={styles.btnText}>Register</Text>
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
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
})
