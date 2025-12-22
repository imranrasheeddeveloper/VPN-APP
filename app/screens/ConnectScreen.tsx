import { useEffect, useState } from 'react'
import { Alert, Text, TouchableOpacity, View } from 'react-native'
import { activeSessions, connectSession, disconnectSession } from '../services/sessions'

export default function ConnectScreen({ route, navigation }: any) {
  const { server, plan } = route.params
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadActive = async () => {
      try {
        const active = await activeSessions()
        const list = Array.isArray(active) ? active : active?.data || []
        setSession(list[0] || null)
      } catch {}
    }
    loadActive()
  }, [])

  const onConnect = async () => {
    setLoading(true)
    try {
      const res = await connectSession(server.id)
      setSession(res)
      // ✅ Later: call native VPN connect using res.config / res.wgConfig etc.
    } catch (e: any) {
      Alert.alert('Connect failed', e?.response?.data?.message || 'Unable to connect')
    } finally {
      setLoading(false)
    }
  }

  const onDisconnect = async () => {
    if (!session?.sessionId && !session?.id) return
    const sessionId = session.sessionId || session.id

    setLoading(true)
    try {
      await disconnectSession(sessionId)
      setSession(null)
    } catch {
      Alert.alert('Disconnect failed', 'Unable to disconnect')
    } finally {
      setLoading(false)
    }
  }

  const connected = !!session

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>
        {server.name}
      </Text>
      <Text>Tier: {plan}</Text>

      <Text style={{ marginTop: 10, fontSize: 18 }}>
        Status: {connected ? 'Connected ✅' : 'Disconnected ❌'}
      </Text>

      {!connected ? (
        <TouchableOpacity
          disabled={loading}
          onPress={onConnect}
          style={{ padding: 14, backgroundColor: '#111', borderRadius: 10 }}
        >
          <Text style={{ color: '#fff', textAlign: 'center' }}>
            {loading ? 'Connecting...' : 'Connect'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          disabled={loading}
          onPress={onDisconnect}
          style={{ padding: 14, backgroundColor: '#c00', borderRadius: 10 }}
        >
          <Text style={{ color: '#fff', textAlign: 'center' }}>
            {loading ? 'Disconnecting...' : 'Disconnect'}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 12 }}>
        <Text style={{ textAlign: 'center' }}>Back</Text>
      </TouchableOpacity>
    </View>
  )
}
