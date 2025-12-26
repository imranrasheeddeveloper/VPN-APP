'use client';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { useAuth } from '../../src/hooks/useAuth'; // 🔴 NEW
import { listServers } from '../../src/services/servers';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Server = {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  city: string;
  isPremium: boolean;
  load: number;
  status: string;
};

type GroupedCountry = {
  country: string;
  countryCode: string;
  servers: Server[];
};

export default function ServersScreen() {
  const [rawServers, setRawServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

  const { plan } = useAuth(); // 🔴 NEW

  useEffect(() => {
    const loadServers = async () => {
      try {
        const res = await listServers();
        const data = res?.data || res || [];
        setRawServers(data.filter((s: Server) => s.status === 'online'));
      } catch (e) {
        console.log('Error loading servers', e);
      } finally {
        setLoading(false);
      }
    };
    loadServers();
  }, []);

  const groupedData = useMemo(() => {
    const groups: { [key: string]: GroupedCountry } = {};
    rawServers.forEach(server => {
      if (!groups[server.country]) {
        groups[server.country] = {
          country: server.country,
          countryCode: server.countryCode,
          servers: [],
        };
      }
      groups[server.country].servers.push(server);
    });
    return Object.values(groups).sort((a, b) =>
      a.country.localeCompare(b.country)
    );
  }, [rawServers]);

  const toggleExpand = (country: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCountry(expandedCountry === country ? null : country);
  };

  // ✅ ONLY LOGIC CHANGE IS HERE
  const selectServer = (server: Server) => {
    if (server.isPremium && plan !== 'premium') {
      Alert.alert(
        'Premium Server',
        'Upgrade to Premium to access this server.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Upgrade',
            onPress: () =>
              router.push({
                pathname: '/screens/UpgradeScreen',
                params: { server: JSON.stringify(server) },
              }),
          },
        ]
      );
      return;
    }

    router.push({
      pathname: '/screens/ConnectScreen',
      params: { server: JSON.stringify(server) },
    });

  };

  const getMetrics = (load: number) => {
    if (load > 0.8) return { color: '#ef4444', label: 'High', bars: 1 };
    if (load > 0.5) return { color: '#f59e0b', label: 'Busy', bars: 2 };
    if (load > 0.05) return { color: '#22c55e', label: 'Best', bars: 3 };
    return { color: '#60a5fa', label: 'Idle', bars: 3 };
  };

  const renderCountry = ({ item }: { item: GroupedCountry }) => {
    const isExpanded = expandedCountry === item.country;

    return (
      <View style={styles.countryGroup}>
        <Pressable
          onPress={() => toggleExpand(item.country)}
          style={[styles.countryHeader, isExpanded && styles.countryHeaderActive]}
        >
          <View style={styles.cardLeft}>
            <View style={styles.flagCircle}>
              <Text style={{ fontSize: 22 }}>
                {getFlagEmoji(item.countryCode)}
              </Text>
            </View>
            <View>
              <Text style={styles.countryName}>{item.country}</Text>
              <Text style={styles.serverCount}>
                {item.servers.length} Locations
              </Text>
            </View>
          </View>
          <Feather
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#9AA6C3"
          />
        </Pressable>

        {isExpanded && (
          <View style={styles.serverList}>
            {item.servers.map(server => {
              const metrics = getMetrics(server.load);
              return (
                <Pressable
                  key={server.id}
                  onPress={() => selectServer(server)}
                  style={styles.serverItem}
                >
                  <View style={styles.serverInfo}>
                    <Text style={styles.cityName}>
                      {server.city || server.name}
                    </Text>
                    <View style={styles.statusRow}>
                      <View
                        style={[
                          styles.pulseDot,
                          { backgroundColor: metrics.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: metrics.color },
                        ]}
                      >
                        {metrics.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardRight}>
                    {server.isPremium && (
                      <View style={styles.premiumBadge}>
                        <Feather name="zap" size={8} color="#0B1224" />
                        <Text style={styles.premiumText}>PRO</Text>
                      </View>
                    )}
                    <View style={styles.signalIcon}>
                      <View
                        style={[
                          styles.signalBar,
                          { height: 4, backgroundColor: metrics.color },
                        ]}
                      />
                      <View
                        style={[
                          styles.signalBar,
                          {
                            height: 7,
                            backgroundColor:
                              metrics.bars >= 2
                                ? metrics.color
                                : 'rgba(255,255,255,0.1)',
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.signalBar,
                          {
                            height: 10,
                            backgroundColor:
                              metrics.bars >= 3
                                ? metrics.color
                                : 'rgba(255,255,255,0.1)',
                          },
                        ]}
                      />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <LinearGradient colors={['#050712', '#070B1D', '#0A1030']} style={styles.container}>
      <View style={styles.header}>
        <Pressable  onPress={() =>
          router.canGoBack()
            ? router.back()
            : BackHandler.exitApp()
        } style={styles.backCircle}>
          <Feather name="chevron-left" size={24} color="#EAF0FF" />
        </Pressable>
        <Text style={styles.title}>Select Location</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator color="#788CFF" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={groupedData}
          keyExtractor={item => item.country}
          renderItem={renderCountry}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
}

function getFlagEmoji(countryCode: string) {
  if (!countryCode) return '🏳️';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginTop: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  backCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(120,140,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#EAF0FF' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  
  countryGroup: { marginBottom: 12, borderRadius: 18, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)' },
  countryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#111827' },
  countryHeaderActive: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  flagCircle: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  countryName: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  serverCount: { fontSize: 12, color: '#9AA6C3', marginTop: 2 },
  
  serverList: { backgroundColor: 'rgba(0,0,0,0.2)', paddingVertical: 4 },
  serverItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, marginLeft: 56, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  serverInfo: { gap: 4 },
  cityName: { fontSize: 14, fontWeight: '600', color: '#EAF0FF' },
  
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  pulseDot: { width: 5, height: 5, borderRadius: 2.5, marginRight: 5 },
  statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FACC15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 3 },
  premiumText: { fontSize: 8, fontWeight: '900', color: '#0B1224' },
  signalIcon: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  signalBar: { width: 3, borderRadius: 1 },
});