import { DeviceEventEmitter, NativeModules } from 'react-native'

const { NativeBilling } = NativeModules

export const initBilling = () => NativeBilling.init()
export const onBuyNative = (sku: string) =>
  NativeBilling.buySubscription(sku)

export const restoreNative = () =>
  NativeBilling.restorePurchases()

export const listenPurchase = (cb: (p: any) => void) =>
  DeviceEventEmitter.addListener('SUBSCRIPTION_PURCHASED', cb)

export const listenRestore = (cb: (p: any) => void) =>
  DeviceEventEmitter.addListener('SUBSCRIPTION_RESTORED', cb)
