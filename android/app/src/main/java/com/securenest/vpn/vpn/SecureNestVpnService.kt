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
import android.os.Handler
import android.os.Looper
import android.os.ParcelFileDescriptor
import java.io.ByteArrayInputStream

class SecureNestVpnService : VpnService() {

    private val channelId = "vpn_channel"
    private val notificationId = 1
    private lateinit var backend: GoBackend
    private val tunnel = WgTunnel()
    private var lastConfig: String? = null
    private var vpnInterface: ParcelFileDescriptor? = null


    companion object {
        var pendingConfig: String? = null
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

        val incomingConfig = intent?.getStringExtra("config")
        if (incomingConfig != null) {
            lastConfig = incomingConfig
        }

        val configString = lastConfig
        if (configString == null) {
            Log.e(TAG, "No VPN config available")
            stopSelf()
            return START_NOT_STICKY
        }

        startForegroundServiceWithNotification()

        try {
            val builder = Builder()
            builder.addDisallowedApplication(packageName)

            vpnInterface?.close()
            vpnInterface = null

            vpnInterface = builder
                .setSession("SecureNest")
                .addAddress("10.0.0.2", 32)
                .establish()

            if (vpnInterface == null) {
                sendStatus("DOWN")
                stopSelf()
                return START_NOT_STICKY
            }

            val config = Config.parse(
                ByteArrayInputStream(configString.toByteArray())
            )

            Handler(Looper.getMainLooper()).postDelayed({
                try {
                    backend.setState(tunnel, Tunnel.State.UP, config)
                    vpnState = "UP"
                    sendStatus("UP")
                } catch (e: Exception) {
                    Log.e(TAG, "WireGuard failed: ${e.message}")
                    sendStatus("DOWN")
                    stopSelf()
                }
            }, 1000)

        } catch (e: Exception) {
            Log.e(TAG, "VPN error: ${e.message}")
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