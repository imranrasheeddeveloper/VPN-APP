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
                pendingConfig?.let { startVpnService(it) }
            }
            pendingConfig = null
        }
    }

    init {
        reactContext.addActivityEventListener(mActivityEventListener)
        SecureNestVpnService.reactContext = reactContext
    }

    // FIXED: The Module doesn't own the 'tunnel' or 'backend'. 
    // We should only run this if the service is alive.
    private val speedUpdater = object : Runnable {
        override fun run() {
            try {
                // We cannot access 'tunnel' directly because it belongs to the Service class.
                // For now, let's keep the logic but you'll need a way to pull 
                // stats from the Service instance.
                
                // Example of how to emit correctly:
                val params = Arguments.createMap()
                params.putDouble("down", 0.0) 
                params.putDouble("up", 0.0)
                
                reactApplicationContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("VPN_STATS", params)
                    
                handler.postDelayed(this, 1000)
            } catch (e: Exception) {
                Log.e("WireGuardModule", "Stats error: ${e.message}")
            }
        }
    }

    @ReactMethod
    fun startStats() {
        // Stop any existing loop first to prevent multiple timers
        handler.removeCallbacks(speedUpdater)
        handler.post(speedUpdater)
    }

    @ReactMethod
    fun stopStats() {
        handler.removeCallbacks(speedUpdater)
        
        // Optional: Send one last 0.0 update to clear the UI
        val params = Arguments.createMap()
        params.putDouble("down", 0.0)
        params.putDouble("up", 0.0)
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("VPN_STATS", params)
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
            activity.startActivityForResult(intent, 0)
            promise.resolve(false) 
        } else {
            promise.resolve(true) 
        }
    }

    @ReactMethod
    fun connect(config: String, promise: Promise) {
        try {
            pendingConfig = config
            startVpnService(config)
            // Start the speed updater when connecting
            handler.post(speedUpdater)
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
        handler.removeCallbacks(speedUpdater)
        val intent = Intent(reactApplicationContext, SecureNestVpnService::class.java)
        reactApplicationContext.stopService(intent)
        promise.resolve(true)
    }

    @ReactMethod
    fun getStatus(promise: Promise) {
        promise.resolve(SecureNestVpnService.vpnState)
    }
}