package com.securenest.vpn.billing

import android.app.Activity
import com.android.billingclient.api.*
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class NativeBillingModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext), PurchasesUpdatedListener {

  private var billingClient: BillingClient? = null

  override fun getName() = "NativeBilling"

  @ReactMethod
  fun init(promise: Promise) {
    billingClient = BillingClient.newBuilder(reactContext)
      .setListener(this)
      .enablePendingPurchases()
      .build()

    billingClient!!.startConnection(object : BillingClientStateListener {
      override fun onBillingSetupFinished(result: BillingResult) {
        if (result.responseCode == BillingClient.BillingResponseCode.OK) {
          promise.resolve(true)
        } else {
          promise.reject("BILLING_INIT_FAILED", result.debugMessage)
        }
      }

      override fun onBillingServiceDisconnected() {}
    })
  }

  /**
   * 🔥 THIS IS YOUR onBuy()
   */
  @ReactMethod
fun buySubscription(productId: String, promise: Promise) {
  val activity = reactContext.currentActivity
    ?: return promise.reject("NO_ACTIVITY", "Activity is null")

  val params = QueryProductDetailsParams.newBuilder()
    .setProductList(
      listOf(
        QueryProductDetailsParams.Product.newBuilder()
          .setProductId(productId)
          .setProductType(BillingClient.ProductType.SUBS)
          .build()
      )
    )
    .build()

  billingClient?.queryProductDetailsAsync(params) { _, products ->
    if (products.isEmpty()) {
      promise.reject("NOT_FOUND", "Subscription not found in Play Console")
      return@queryProductDetailsAsync
    }

    val product = products.first()
    val offer = product.subscriptionOfferDetails?.firstOrNull()

    if (offer == null) {
      promise.reject("NO_OFFER", "No active base plan")
      return@queryProductDetailsAsync
    }

    val billingFlowParams =
      BillingFlowParams.newBuilder()
        .setProductDetailsParamsList(
          listOf(
            BillingFlowParams.ProductDetailsParams.newBuilder()
              .setProductDetails(product)
              .setOfferToken(offer.offerToken)
              .build()
          )
        )
        .build()

    billingClient?.launchBillingFlow(activity, billingFlowParams)
    promise.resolve(true)
  }
}


  @ReactMethod
fun restorePurchases(promise: Promise) {
  billingClient?.queryPurchasesAsync(
    QueryPurchasesParams.newBuilder()
      .setProductType(BillingClient.ProductType.SUBS)
      .build()
  ) { result, purchases ->
    if (result.responseCode != BillingClient.BillingResponseCode.OK) {
      promise.reject("RESTORE_FAILED", result.debugMessage)
      return@queryPurchasesAsync
    }

    if (purchases.isEmpty()) {
      promise.resolve(null)
      return@queryPurchasesAsync
    }

    purchases.forEach { purchase ->
      val map = Arguments.createMap()
      map.putString("productId", purchase.products.first())
      map.putString("purchaseToken", purchase.purchaseToken)

      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("SUBSCRIPTION_RESTORED", map)
    }

    promise.resolve(true)
  }
}


  override fun onPurchasesUpdated(
    result: BillingResult,
    purchases: MutableList<Purchase>?
  ) {
    if (result.responseCode == BillingClient.BillingResponseCode.OK) {
      purchases?.forEach { purchase ->
        val map = Arguments.createMap()
        map.putString("productId", purchase.products.first())
        map.putString("purchaseToken", purchase.purchaseToken)

        reactContext
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          .emit("SUBSCRIPTION_PURCHASED", map)
      }
    }
  }
}
