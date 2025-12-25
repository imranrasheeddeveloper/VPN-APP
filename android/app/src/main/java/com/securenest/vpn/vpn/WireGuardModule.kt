package com.securenest.vpn.vpn

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import com.facebook.react.bridge.*

class WireGuardModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    init {
        SecureNestVpnService.reactContext = reactContext
    }

    override fun invalidate() {
        super.invalidate()
        SecureNestVpnService.reactContext = null
    }

    override fun getName(): String = "WireGuardModule"

    @ReactMethod
      fun prepare(promise: Promise) {
          // 1. Get the activity from the context explicitly
          val activity = reactApplicationContext.currentActivity
          
          if (activity == null) {
              promise.reject("NO_ACTIVITY", "Activity is null")
              return
          }

          // 2. VpnService.prepare expects a Context. 
          // Passing 'activity' (which is a Context) is correct.
          val intent = VpnService.prepare(activity)
          
          if (intent != null) {
              try {
                  // 3. You must call startActivityForResult on the activity object
                  activity.startActivityForResult(intent, 0)
                  promise.resolve(false) 
              } catch (e: Exception) {
                  promise.reject("PREPARE_ERROR", e.message)
              }
          } else {
              promise.resolve(true) 
          }
      }
    @ReactMethod
    fun connect(config: String, promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, SecureNestVpnService::class.java)
            intent.putExtra("config", config)
            // Start service via the context
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

    @ReactMethod
    fun getStatus(promise: Promise) {
        try {
            val status = SecureNestVpnService.vpnState
            promise.resolve(status)
        } catch (e: Exception) {
            promise.reject("STATUS_ERROR", e.message)
        }
    }


}