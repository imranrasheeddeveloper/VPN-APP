import { useEffect, useState } from 'react'
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native'
import { listServers } from '../services/servers'

export default function ServersScreen({ route, navigation }: any) {
  const { device, plan } = route.params
  const [servers, setServers] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const data = await listServers()
        setServers(Array.isArray(data) ? data : data?.data || [])
      } catch {
        Alert.alert('Error', 'Failed to load servers')
      }
    }
    load()
  }, [])

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Servers</Text>
      <Text style={{ marginBottom: 12 }}>Plan: {plan}</Text>

      <FlatList
        data={servers}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const isPremium = !!item.isPremium || item.tier === 'premium'
          const locked = isPremium && plan !== 'premium'

          return (
            <TouchableOpacity
              disabled={locked}
              onPress={() => navigation.navigate('Connect', { device, plan, server: item })}
              style={{
                padding: 14,
                borderWidth: 1,
                borderRadius: 12,
                marginBottom: 10,
                opacity: locked ? 0.5 : 1,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.name}</Text>
              <Text>{item.country} • {isPremium ? 'Premium' : 'Free'}</Text>

              {locked ? (
                <TouchableOpacity
                    onPress={() => navigation.navigate('Upgrade')}
                    style={{ marginTop: 6 }}
                >
                    <Text style={{ color: 'red' }}>
                    Premium server — Upgrade required
                    </Text>
                </TouchableOpacity>
                ) : null}

            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}
