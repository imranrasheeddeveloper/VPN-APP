import { router } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors } from '../../src/theme'

export default function AuthChoiceScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>SecureNest</Text>
      <Text style={styles.tag}>Private • Fast • Secure</Text>

      <TouchableOpacity
        style={styles.primary}
        onPress={() => router.push('/screens/LoginScreen')}
      >
        <Text style={styles.btnText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondary}
        onPress={() => router.push('/screens/RegisterScreen')}
      >
        <Text style={styles.btnText}>Continue as Guest</Text>
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
  logo: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
  },
  tag: {
    color: colors.muted,
    marginBottom: 36,
  },
  primary: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },
  secondary: {
    backgroundColor: '#334155',
    padding: 16,
    borderRadius: 18,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
})
