package com.securenest.vpn.vpn

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import com.facebook.react.bridge.*

class WireGuardModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var pendingConfig: String? = null

    private val mActivityEventListener = object : BaseActivityEventListener() {
        // EXACT signature based on your error: No '?' on activity, '?' on data
        override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
            if (requestCode == 0 && resultCode == Activity.RESULT_OK) {
                // Now that we have permission, start the service!
                pendingConfig?.let { startVpnService(it) }
            }
            pendingConfig = null
        }
    }

    init {
        reactContext.addActivityEventListener(mActivityEventListener)
        SecureNestVpnService.reactContext = reactContext
    }

    override fun invalidate() {
        super.invalidate()
        SecureNestVpnService.reactContext = null
    }

    override fun getName(): String = "WireGuardModule"

    @ReactMethod
    fun prepare(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity is null")
            return
        }

        val intent = VpnService.prepare(activity)
        if (intent != null) {
            try {
                // RequestCode is 0
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
            // Save the config. If permission is already granted, start immediately.
            // If not, onActivityResult will use this later.
            pendingConfig = config
            startVpnService(config)
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
        val intent = Intent(reactApplicationContext, SecureNestVpnService::class.java)
        reactApplicationContext.stopService(intent)
        promise.resolve(true)
    }

    @ReactMethod
    fun getStatus(promise: Promise) {
        try {
            promise.resolve(SecureNestVpnService.vpnState)
        } catch (e: Exception) {
            promise.reject("STATUS_ERROR", e.message)
        }
    }
}