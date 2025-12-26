import { Feather } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import type { Purchase } from 'react-native-iap'

import {
  Alert,
  DeviceEventEmitter,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import * as RNIap from 'react-native-iap'
import { useAuth } from '../../src/hooks/useAuth'
import { verifySubscription } from '../../src/services/subscriptions'
import { colors } from '../../src/theme'
const IAP: any = RNIap

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

  const params = useLocalSearchParams()
  const targetServer = params.server

  const { plan } = useAuth() // 🔴 ONLY USED FOR AUTO-RETURN

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
// useEffect(() => {
//   console.log('🧾 RN-IAP methods:', Object.keys(IAP));
// }, []);
  /**
   * ================================
   * AUTO-RETURN AFTER PREMIUM
   * ================================
   */
  useEffect(() => {
    if (plan === 'premium' && targetServer) {
      router.push({
        pathname: '/screens/ConnectScreen',
        params: { server: targetServer },
      })
    }
  }, [plan, targetServer])

  /**
   * ================================
   * BUY SUBSCRIPTION
   * ================================
   */
  const onBuy = async () => {
  setBuying(true);

  try {
    const productId =
      selected === 'monthly'
        ? 'premium_monthly'
        : 'premium_yearly';

    // ✅ Fetch subscription product (this is correct for your API)
    const products = await IAP.fetchProducts({
      skus: [productId],
    });

    console.log('🛒 Products:', products);

    if (!products || products.length === 0) {
      throw new Error('Subscription product not found');
    }

    // ✅ Request purchase (subscriptions included)
    const purchase = await IAP.requestPurchase({
      sku: productId,
    });

    console.log('💳 Purchase:', purchase);

    // ✅ Finish / acknowledge purchase (MANDATORY on Android)
    await IAP.finishTransaction({
      purchase,
      isConsumable: false,
    });

    try {
      await verifySubscription(
        productId,
        purchase.purchaseToken,
      );

      DeviceEventEmitter.emit('AUTH_TOKEN_CHANGED');
    } catch {
      await AsyncStorage.setItem(
        'PENDING_PURCHASE_TOKEN',
        purchase.purchaseToken,
      );
    }

    Alert.alert('Success', 'Premium activated!');
  } catch (e: any) {
    console.log('❌ Purchase error:', e);
    Alert.alert(
      'Purchase failed',
      e?.message || 'Try again'
    );
  } finally {
    setBuying(false);
  }
};




  const onRestore = async () => {
    try {
      const purchases = await IAP.getAvailablePurchases();

      if (!purchases.length) {
        Alert.alert('No purchases found');
        return;
      }

      const sub = purchases.find(
        (p: Purchase) =>
          p.productId === 'premium_monthly' ||
          p.productId === 'premium_yearly',
      );

      if (!sub?.purchaseToken) {
        Alert.alert('No valid subscription found');
        return;
      }

      // 🔐 Save locally for later login
      await AsyncStorage.setItem(
        'PENDING_PURCHASE_TOKEN',
        sub.purchaseToken,
      );

      Alert.alert(
        'Purchase restored',
        'Please login to activate premium',
      );
    } catch (e) {
      Alert.alert('Restore failed', 'Try again later');
    }
  };


  /**
   * ================================
   * UI (UNCHANGED)
   * ================================
   */
  return (
    <LinearGradient
      colors={['#050712', '#070B1D', '#0A1030']}
      style={styles.container}
    >
      <View style={styles.top}>
       <Pressable
          onPress={() => router.back()}
          style={styles.backButtonAbsolute}
        >
          <View style={styles.backCircle}>
            <Feather name="chevron-left" size={24} color="#EAF0FF" />
          </View>
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
        <Text style={styles.feature}>• Kill switch</Text>
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

      <Pressable onPress={onRestore} style={styles.restoreBtn}>
        <Text style={styles.restoreText}>Restore Purchase</Text>
      </Pressable>
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
  title: { marginTop: 40, fontSize: 28, fontWeight: '900', color: '#EAF0FF' },
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
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(120,140,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonAbsolute: {
    position: 'absolute',
    left: 0,
    top: 0,
  },

  restoreBtn: {
    marginTop: 10,
    alignItems: 'center',
  },

  restoreText: {
    color: '#9AA6C3',
    fontSize: 14,
    fontWeight: '600',
  },


})
