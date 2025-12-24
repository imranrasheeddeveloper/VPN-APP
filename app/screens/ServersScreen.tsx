import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { listServers } from '../../src/services/servers'
import { colors } from '../../src/theme'

type Server = {
  id: number
  name: string
  country: string
  isPremium?: boolean
  tier?: string
}

export default function ServersScreen() {
  const { plan } = useLocalSearchParams<{ plan?: string }>()
  const [servers, setServers] = useState<Server[]>([])
  const userPlan = plan || 'free'

  useEffect(() => {
    const loadServers = async () => {
      try {
        const res = await listServers()
        setServers(res?.data || res || [])
      } catch (e) {
        console.log('❌ Failed to load servers', e)
      }
    }

    loadServers()
  }, [])

  const renderItem = ({ item }: { item: Server }) => {
    const isPremium = item.isPremium || item.tier === 'premium'
    const locked = isPremium && userPlan !== 'premium'

    return (
      <TouchableOpacity
          disabled={locked}
          style={[styles.card, locked && styles.locked]}
          onPress={() =>
            router.push({
              pathname: '/screens/ConnectScreen',
              params: {
                server: JSON.stringify(item),
                plan: userPlan,
              },
            })
          }
        >
        <View>
          <Text style={styles.serverName}>{item.name}</Text>
          <Text style={styles.country}>{item.country}</Text>
        </View>

        <Text style={isPremium ? styles.premium : styles.free}>
          {isPremium ? 'Premium' : 'Free'}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Server</Text>
      <Text style={styles.plan}>Plan: {userPlan}</Text>

      <FlatList
        data={servers}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  plan: {
    color: colors.muted,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    borderRadius: 20,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locked: {
    opacity: 0.4,
  },
  serverName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  country: {
    color: colors.muted,
    marginTop: 2,
  },
  premium: {
    color: '#facc15',
    fontWeight: '700',
  },
  free: {
    color: '#22c55e',
    fontWeight: '700',
  },
})
