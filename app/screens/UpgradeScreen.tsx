import { router } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors } from '../../src/theme'

export default function UpgradeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Go Premium 🚀</Text>
      <Text style={styles.desc}>Unlimited speed and premium servers</Text>

      <TouchableOpacity style={styles.primary}>
        <Text style={styles.btnText}>Upgrade (Coming Soon)</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.cancel}>Not now</Text>
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
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  desc: {
    color: colors.muted,
    marginVertical: 16,
  },
  primary: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  cancel: {
    color: colors.muted,
    textAlign: 'center',
  },
})
