package com.securenest.vpn.vpn

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class WireGuardModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var pendingConfig: String? = null
    // FIXED: Added correct imports for Handler and Looper
    private val handler = Handler(Looper.getMainLooper())

    private val mActivityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
            if (requestCode == 0 && resultCode == Activity.RESULT_OK) {
                // 🔔 Notify JS permission is granted
                reactApplicationContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("VPN_PERMISSION_GRANTED", null)
            }
            pendingConfig = null
        }
    }

    init {
        reactContext.addActivityEventListener(mActivityEventListener)
        SecureNestVpnService.reactContext = reactContext
    }

    @ReactMethod
    fun startStats() {
       
    }

    @ReactMethod
    fun stopStats() {

    }

    override fun getName(): String = "WireGuardModule"

    @ReactMethod
    fun prepare(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
            ?: run {
                promise.reject("NO_ACTIVITY", "Activity is null")
                return
            }

        val intent = VpnService.prepare(activity)

        if (intent != null) {
            // Permission REQUIRED — user dialog will appear
            activity.startActivityForResult(intent, 0)
            promise.resolve("REQUESTED")
        } else {
            // Permission already granted
            promise.resolve("GRANTED")
        }
    }

    @ReactMethod
    fun connect(config: String, promise: Promise) {
        try {
            pendingConfig = config
            startVpnService(config)
            // Start the speed updater when connecting
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CONNECT_ERROR", e.message)
        }
    }

    private fun startVpnService(config: String) {
        val intent = Intent(reactApplicationContext, SecureNestVpnService::class.java)
        intent.putExtra("config", config)
        reactApplicationContext.startService(intent)
    }

   @ReactMethod
    fun disconnect(promise: Promise) {
        SecureNestVpnService.pendingConfig = null
        val intent = Intent(reactApplicationContext, SecureNestVpnService::class.java)
        reactApplicationContext.stopService(intent)
        promise.resolve(true)
    }


    @ReactMethod
    fun getStatus(promise: Promise) {
        promise.resolve(SecureNestVpnService.vpnState)
    }
}