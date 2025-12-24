import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../src/theme'

// ---- Pricing (edit values anytime)
type PlanKey = 'weekly' | 'monthly' | 'yearly'
type Plan = { key: PlanKey; title: string; price: string; sub: string; badge?: string }

export default function UpgradeScreen() {
  const plans: Plan[] = useMemo(
    () => [
      { key: 'weekly', title: 'Weekly', price: '$2.99', sub: 'Billed weekly' },
      { key: 'monthly', title: 'Monthly', price: '$7.99', sub: 'Most popular', badge: 'POPULAR' },
      { key: 'yearly', title: 'Yearly', price: '$39.99', sub: 'Best value', badge: 'BEST VALUE' },
    ],
    []
  )

  const [selected, setSelected] = useState<PlanKey>('yearly')
  const [buying, setBuying] = useState(false)

  const onBuy = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})

    // ✅ UX: require login before purchase (recommended)
    // If you want to allow purchase without login, remove this.
    // router.push('/screens/LoginScreen'); return;

    setBuying(true)
    try {
      if (Platform.OS !== 'android') {
        Alert.alert('Info', 'Google Play purchase is Android only (for now).')
        return
      }

      /**
       * ✅ Google Play Billing (real implementation)
       * - Requires Dev Build (EAS) + react-native-iap
       * - Product IDs must match Google Play Console subscriptions
       *
       * PSEUDO:
       * 1) initConnection()
       * 2) getSubscriptions([ids])
       * 3) requestSubscription({ sku })
       * 4) on purchase success -> call backend to upgrade plan
       * 5) refresh profile/token
       */
      Alert.alert(
        'Coming Next',
        `Purchase flow for "${selected}" will start here.\n\n(Needs Dev Build + Google Play subscription IDs.)`
      )
    } catch (e: any) {
      Alert.alert('Purchase failed', e?.message || 'Please try again')
    } finally {
      setBuying(false)
    }
  }

  return (
    <LinearGradient colors={['#050712', '#070B1D', '#0A1030']} style={styles.container}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Go Premium</Text>
        <Text style={styles.subtitle}>Unlock fastest routes + premium locations</Text>
      </View>

      <View style={styles.cards}>
        {plans.map((p) => {
          const active = p.key === selected
          return (
            <Pressable
              key={p.key}
              onPress={() => {
                setSelected(p.key)
                Haptics.selectionAsync().catch(() => {})
              }}
              style={[styles.card, active && styles.cardActive]}
            >
              {p.badge ? (
                <View style={[styles.badge, p.badge === 'BEST VALUE' ? styles.badgeGold : styles.badgeBlue]}>
                  <Text style={styles.badgeText}>{p.badge}</Text>
                </View>
              ) : null}

              <Text style={styles.cardTitle}>{p.title}</Text>
              <Text style={styles.cardPrice}>{p.price}</Text>
              <Text style={styles.cardSub}>{p.sub}</Text>

              <View style={[styles.radio, active && styles.radioActive]} />
            </Pressable>
          )
        })}
      </View>

      <View style={styles.features}>
        <Text style={styles.feature}>• Unlimited speed</Text>
        <Text style={styles.feature}>• Premium locations</Text>
        <Text style={styles.feature}>• Priority routing</Text>
        <Text style={styles.feature}>• Kill switch (next)</Text>
      </View>

      <Pressable
        disabled={buying}
        onPress={onBuy}
        style={[styles.buyBtn, buying && { opacity: 0.75 }]}
      >
        <Text style={styles.buyText}>{buying ? 'Processing…' : 'Continue to Google Play'}</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/screens/LoginScreen')}>
        <Text style={styles.loginHint}>Already purchased? Sign in to restore.</Text>
      </Pressable>

      <Text style={styles.legal}>
        Subscriptions renew automatically unless canceled 24h before renewal.
      </Text>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18 },
  top: { marginTop: 10, alignItems: 'center' },
  backBtn: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(10,16,48,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(120,140,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: '#EAF0FF', fontWeight: '900', fontSize: 16 },

  title: { marginTop: 10, fontSize: 28, fontWeight: '900', color: '#EAF0FF' },
  subtitle: { color: '#9AA6C3', marginTop: 6 },

  cards: { marginTop: 18, gap: 12 },
  card: {
    backgroundColor: 'rgba(5,7,18,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(120,140,255,0.25)',
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: 'rgba(250,204,21,0.55)',
    shadowColor: '#facc15',
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  badge: {
    position: 'absolute',
    right: 12,
    top: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeGold: { backgroundColor: '#FACC15' },
  badgeBlue: { backgroundColor: '#60A5FA' },
  badgeText: { fontWeight: '900', fontSize: 10, color: '#0B1224', letterSpacing: 0.6 },

  cardTitle: { color: '#EAF0FF', fontWeight: '900', fontSize: 16 },
  cardPrice: { color: '#EAF0FF', fontWeight: '900', fontSize: 24, marginTop: 6 },
  cardSub: { color: '#9AA6C3', marginTop: 4 },

  radio: {
    position: 'absolute',
    left: 14,
    top: 16,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(234,240,255,0.45)',
  },
  radioActive: { backgroundColor: '#FACC15', borderColor: '#FACC15' },

  features: { marginTop: 16, padding: 14 },
  feature: { color: '#EAF0FF', marginBottom: 8, fontWeight: '700' },

  buyBtn: {
    marginTop: 'auto',
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyText: { color: '#fff', fontWeight: '900', fontSize: 16 },

  loginHint: { color: '#9AA6C3', textAlign: 'center', marginTop: 12 },
  legal: { color: 'rgba(154,166,195,0.7)', textAlign: 'center', marginTop: 10, fontSize: 12 },
})
