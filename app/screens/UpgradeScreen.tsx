import { Text, TouchableOpacity, View } from 'react-native'

export default function UpgradeScreen({ navigation }: any) {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 28, fontWeight: '800', marginBottom: 10 }}>
        Go Premium 🚀
      </Text>

      <Text style={{ fontSize: 16, marginBottom: 20 }}>
        Unlock all premium servers, higher speed, and unlimited sessions.
      </Text>

      <View style={{ marginBottom: 20 }}>
        <Text>✅ Access Premium Servers</Text>
        <Text>✅ Faster Speeds</Text>
        <Text>✅ Priority Routing</Text>
        <Text>✅ Unlimited Sessions</Text>
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: '#111',
          padding: 16,
          borderRadius: 12,
          marginBottom: 10,
        }}
        onPress={() => {
          // Placeholder for Stripe / Apple / Google IAP
          alert('Subscription coming soon')
        }}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontSize: 16 }}>
          Upgrade (Coming Soon)
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ textAlign: 'center', color: '#555' }}>Not now</Text>
      </TouchableOpacity>
    </View>
  )
}
