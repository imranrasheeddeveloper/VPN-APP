import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { listServers } from '../../src/services/servers';
import { colors } from '../../src/theme';

type Server = {
  id: number;
  name: string;
  country: string;
  countryCode: string; // e.g., "US", "DE", "GB"
  isPremium: boolean;
  load?: number; // 0-100
};

export default function ServersScreen() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Servers
  useEffect(() => {
    const loadServers = async () => {
      try {
        const res = await listServers();
        setServers(res?.data || res || []);
      } catch (e) {
        console.log('Error loading servers', e);
      } finally {
        setLoading(false);
      }
    };
    loadServers();
  }, []);

  // 2. FIXED BACK HANDLING
  useEffect(() => {
    const onBack = () => {
      router.back(); // Standard back to ConnectScreen
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => subscription.remove();
  }, []);

  const selectServer = (server: Server) => {
    router.replace({
      pathname: '/screens/ConnectScreen',
      params: { server: JSON.stringify(server) },
    });
  };

  const renderServer = ({ item }: { item: Server }) => (
    <Pressable 
      onPress={() => selectServer(item)} 
      style={({ pressed }) => [styles.serverCard, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.cardLeft}>
        {/* Flag Placeholder - You can use a library like react-native-country-flag */}
        <View style={styles.flagCircle}>
          <Text style={{ fontSize: 20 }}>{getFlagEmoji(item.countryCode || 'US')}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.serverName}>{item.name}</Text>
          <Text style={styles.serverCountry}>{item.country}</Text>
        </View>
      </View>

      <View style={styles.cardRight}>
        {item.isPremium && (
          <View style={styles.premiumBadge}>
            <Feather name="zap" size={10} color="#0B1224" />
            <Text style={styles.premiumText}>PRO</Text>
          </View>
        )}
        <View style={styles.signalIcon}>
          <View style={[styles.signalBar, { height: 6, backgroundColor: '#22c55e' }]} />
          <View style={[styles.signalBar, { height: 10, backgroundColor: '#22c55e' }]} />
          <View style={[styles.signalBar, { height: 14, backgroundColor: '#22c55e' }]} />
        </View>
      </View>
    </Pressable>
  );

  return (
    <LinearGradient colors={['#050712', '#070B1D', '#0A1030']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backCircle}>
          <Feather name="chevron-left" size={24} color="#EAF0FF" />
        </Pressable>
        <Text style={styles.title}>Locations</Text>
        <View style={{ width: 40 }} /> 
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={servers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderServer}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
}

// Helper for Flag Emojis
function getFlagEmoji(countryCode: string) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    marginTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(120,140,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#EAF0FF' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  serverCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(120,140,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(120,140,255,0.15)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  flagCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(120,140,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  info: { gap: 2 },
  serverName: { fontSize: 16, fontWeight: '700', color: '#EAF0FF' },
  serverCountry: { fontSize: 13, color: '#9AA6C3' },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FACC15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  premiumText: { fontSize: 10, fontWeight: '900', color: '#0B1224' },
  signalIcon: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  signalBar: { width: 3, borderRadius: 1 },
});