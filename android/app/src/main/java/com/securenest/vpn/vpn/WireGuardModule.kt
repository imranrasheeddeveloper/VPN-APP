package com.securenest.vpn.vpn

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import com.facebook.react.bridge.*

class WireGuardModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {


    // Inside your WireGuardModule.kt class
    init {
        SecureNestVpnService.reactContext = reactContext
    }

    // In WireGuardModule.kt
      override fun invalidate() {
          super.invalidate()
          SecureNestVpnService.reactContext = null
      }
    // This MUST match what you use in JS: NativeModules.WireGuardModule
    override fun getName(): String = "WireGuardModule"
    

    @ReactMethod
    fun prepare(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity is null")
            return
        }

        val intent = VpnService.prepare(activity)
        if (intent != null) {
            // This triggers the "Allow VPN Connection" system dialog
            activity.startActivityForResult(intent, 0)
            promise.resolve(false) // Not ready yet, user needs to accept
        } else {
            promise.resolve(true) // Already prepared
        }
    }

    @ReactMethod
    fun connect(config: String, promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, SecureNestVpnService::class.java)
            intent.putExtra("config", config)
            reactApplicationContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CONNECT_ERROR", e.message)
        }
    }

    @ReactMethod
    fun disconnect(promise: Promise) {
        val intent = Intent(reactApplicationContext, SecureNestVpnService::class.java)
        reactApplicationContext.stopService(intent)
        promise.resolve(true)
    }
}