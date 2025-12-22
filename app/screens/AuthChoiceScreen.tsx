import { Text, TouchableOpacity, View } from 'react-native'

export default function AuthChoiceScreen({ route, navigation }: any) {
  const { device } = route.params

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 26, fontWeight: '700' }}>SecureNest VPN</Text>

      <TouchableOpacity
        style={{ padding: 14, backgroundColor: '#111', borderRadius: 10 }}
        onPress={() => navigation.replace('Servers', { device, plan: 'free' })}
      >
        <Text style={{ color: '#fff', textAlign: 'center' }}>Continue Free</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ padding: 14, backgroundColor: '#ddd', borderRadius: 10 }}
        onPress={() => navigation.navigate('Login', { device })}
      >
        <Text style={{ textAlign: 'center' }}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ padding: 14, backgroundColor: '#ddd', borderRadius: 10 }}
        onPress={() => navigation.navigate('Register', { device })}
      >
        <Text style={{ textAlign: 'center' }}>Register</Text>
      </TouchableOpacity>
    </View>
  )
}
