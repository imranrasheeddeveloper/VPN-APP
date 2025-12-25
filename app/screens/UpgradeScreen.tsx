import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import * as RNIap from 'react-native-iap'
import { colors } from '../../src/theme'

/**
 * ================================
 * FORCE ANY (FIXES BROKEN TYPES)
 * ================================
 */
const IAP: any = RNIap

/**
 * ================================
 * SUBSCRIPTION IDS
 * ================================
 */
const SUB_IDS = ['premium_monthly', 'premium_yearly']

type PlanKey = 'monthly' | 'yearly'
type Plan = {
  key: PlanKey
  title: string
  price: string
  sub: string
  badge?: string
}

export default function UpgradeScreen() {
  /**
   * ================================
   * SAFE PRICING
   * ================================
   */
  const plans: Plan[] = useMemo(
    () => [
      {
        key: 'monthly',
        title: 'Monthly',
        price: '$14.99',
        sub: 'Billed monthly',
        badge: 'POPULAR',
      },
      {
        key: 'yearly',
        title: 'Yearly',
        price: '$99.99',
        sub: 'Best value',
        badge: 'BEST VALUE',
      },
    ],
    []
  )

  const [selected, setSelected] = useState<PlanKey>('yearly')
  const [buying, setBuying] = useState(false)

  /**
   * ================================
   * INIT / CLEANUP BILLING
   * ================================
   */
  useEffect(() => {
    if (Platform.OS === 'android') {
      IAP.initConnection()
    }
    return () => {
      IAP.endConnection()
    }
  }, [])

  useEffect(() => {
  console.log('IAP methods:', Object.keys(RNIap))
}, [])

  /**
   * ================================
   * BUY SUBSCRIPTION (WORKING)
   * ================================
   */
  const onBuy = async () => {
  setBuying(true)
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})

  try {
    if (Platform.OS !== 'android') {
      Alert.alert('Android only', 'Google Play Billing works on Android only')
      return
    }

    if (!IAP.fetchProducts || !IAP.requestPurchase) {
      Alert.alert(
        'Billing not ready',
        'In-app purchases are not available in this build.'
      )
      return
    }

    const productId =
      selected === 'monthly'
        ? 'premium_monthly'
        : 'premium_yearly'

    // 1️⃣ Fetch subscription products
    const products = await IAP.fetchProducts({
      skus: [productId],
      type: 'subs', // 🔴 IMPORTANT: this tells Google it is a subscription
    })

    if (!products || products.length === 0) {
      Alert.alert('Error', 'Subscription not found in Play Console')
      return
    }

    const product = products[0]

    // 2️⃣ Start purchase
    await IAP.requestPurchase({
      sku: product.productId,
    })

    // purchaseUpdatedListener will handle success
  } catch (e: any) {
    Alert.alert('Purchase failed', e?.message || 'Please try again')
  } finally {
    setBuying(false)
  }
}


  return (
    <LinearGradient
      colors={['#050712', '#070B1D', '#0A1030']}
      style={styles.container}
    >
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <Text style={styles.title}>Go Premium</Text>
        <Text style={styles.subtitle}>
          Unlimited speed · Premium locations · Priority routing
        </Text>
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
              {p.badge && (
                <View
                  style={[
                    styles.badge,
                    p.badge === 'BEST VALUE'
                      ? styles.badgeGold
                      : styles.badgeBlue,
                  ]}
                >
                  <Text style={styles.badgeText}>{p.badge}</Text>
                </View>
              )}

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
        <Text style={styles.feature}>• Kill switch (coming soon)</Text>
      </View>

      <Pressable
        disabled={buying}
        onPress={onBuy}
        style={[styles.buyBtn, buying && { opacity: 0.7 }]}
      >
        <Text style={styles.buyText}>
          {buying ? 'Processing…' : 'Continue to Google Play'}
        </Text>
      </Pressable>

      <Text style={styles.legal}>
        Subscription renews automatically unless canceled 24 hours before renewal.
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
  subtitle: { color: '#9AA6C3', marginTop: 6, textAlign: 'center' },
  cards: { marginTop: 18, gap: 12 },
  card: {
    backgroundColor: 'rgba(5,7,18,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(120,140,255,0.25)',
    borderRadius: 20,
    padding: 16,
  },
  cardActive: { borderColor: 'rgba(250,204,21,0.55)' },
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
  badgeText: { fontWeight: '900', fontSize: 10, color: '#0B1224' },
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
  },
  buyText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  legal: {
    color: 'rgba(154,166,195,0.7)',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 12,
  },
})
