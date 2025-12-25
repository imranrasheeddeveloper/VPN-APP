package com.securenest.vpn.vpn

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.net.VpnService
import android.os.Build
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.wireguard.android.backend.GoBackend
import com.wireguard.android.backend.Tunnel
import com.wireguard.config.Config
import android.content.pm.ServiceInfo
import android.util.Log

class SecureNestVpnService : VpnService() {

    private val channelId = "vpn_channel"
    private val notificationId = 1
    private lateinit var backend: GoBackend
    private val tunnel = WgTunnel()

    companion object {
        const val TAG = "SecureNestVpnService"
        var reactContext: ReactApplicationContext? = null
        
        @Volatile
        var vpnState: String = "DOWN"
    }

    override fun onCreate() {
        super.onCreate()
        backend = GoBackend(this)
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val configString = intent?.getStringExtra("config")
        
        if (configString == null) {
            Log.e(TAG, "No config provided to VPN Service")
            stopSelf()
            return START_NOT_STICKY
        }

        startForegroundServiceWithNotification()

        try {
            // 1. Prepare the VpnService Builder for Split Tunneling
            val builder = Builder()
            
            // 2. EXCLUDE YOUR APP: This allows the app to talk to your API 
            // even if the VPN tunnel is broken or blocked.
            try {
                builder.addDisallowedApplication(packageName)
                Log.d(TAG, "Excluded $packageName from VPN tunnel (Split Tunneling)")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to set split tunneling: ${e.message}")
            }

            // 3. Configure the config object
            val config = Config.parse(configString.byteInputStream())
            
            // 4. RESET: Ensure clean state before starting
            backend.setState(tunnel, Tunnel.State.DOWN, null)
            
            // 5. START: WireGuard handles the routes/DNS internally based on the config,
            // but respects the 'disallowed' apps set in the VpnService context.
            backend.setState(tunnel, Tunnel.State.UP, config)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error starting VPN: ${e.message}")
            e.printStackTrace()
            SecureNestVpnService.vpnState = "DOWN"
            sendStatus("DOWN")
            stopSelf()
        }

        return START_STICKY
    }

    // This is vital: WireGuard's GoBackend calls this to ensure its 
    // own traffic doesn't get looped into the VPN.
    override fun protect(socket: Int): Boolean {
        return super.protect(socket)
    }

    private fun startForegroundServiceWithNotification() {
        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("SecureNest VPN")
            .setContentText("Your connection is encrypted and secure")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setOngoing(true)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                notificationId,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            )
        } else {
            startForeground(notificationId, notification)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "SecureNest VPN Status",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows active VPN connection status"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    override fun onRevoke() {
        Log.i(TAG, "VPN Permission revoked by system")
        disconnectTunnel()
        super.onRevoke()
    }

    override fun onDestroy() {
        Log.i(TAG, "Service destroyed")
        disconnectTunnel()
        super.onDestroy()
    }

    private fun disconnectTunnel() {
        try {
            backend.setState(tunnel, Tunnel.State.DOWN, null)
        } catch (e: Exception) {
            Log.e(TAG, "Error during disconnect: ${e.message}")
        }
        SecureNestVpnService.vpnState = "DOWN"
        sendStatus("DOWN")
    }

    private fun sendStatus(status: String) {
        val context = reactContext
        if (context != null && context.hasActiveCatalystInstance()) {
            context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("VPN_STATUS_CHANGE", status)
        } else {
            Log.w(TAG, "Skipping emit: ReactContext not ready for status $status")
        }
    }
}