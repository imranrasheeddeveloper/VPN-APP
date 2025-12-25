import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Pressable, StyleSheet, Text } from 'react-native'
import { useAuth } from '../../src/hooks/useAuth'
import { clearToken } from '../../src/storage/token'

export default function ProfileScreen() {
  const { email, plan } = useAuth()

  const logout = async () => {
    await clearToken()
    router.replace('/screens/SplashScreen')
  }

  return (
    <LinearGradient colors={['#050712', '#070B1D', '#0A1030']} style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <Text style={styles.label}>Email</Text>
      <Text style={styles.value}>{email}</Text>

      <Text style={styles.label}>Plan</Text>
      <Text style={styles.value}>{plan.toUpperCase()}</Text>

      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: '900', color: '#EAF0FF', marginBottom: 30 },
  label: { color: '#9AA6C3', marginTop: 10 },
  value: { color: '#EAF0FF', fontWeight: '700', marginTop: 4 },
  logoutBtn: {
    marginTop: 40,
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontWeight: '900' },
})
