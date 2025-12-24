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

class SecureNestVpnService : VpnService() {
    private val channelId = "vpn_channel"
    private val backend by lazy { GoBackend(this) }
    private val tunnel = WgTunnel()

    companion object {
        var reactContext: ReactApplicationContext? = null
    }

    override fun onCreate() {
        super.onCreate()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "VPN Status",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val configString = intent?.getStringExtra("config") ?: return START_NOT_STICKY

    val notification = NotificationCompat.Builder(this, channelId)
        .setContentTitle("SecureNest VPN")
        .setContentText("VPN is active")
        .setSmallIcon(android.R.drawable.ic_dialog_info)
        .setPriority(NotificationCompat.PRIORITY_LOW) // Good practice for persistent services
        .build()

    // FIXED VERSION CHECK
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) { // Android 14 (API 34)+
        startForeground(
            1, 
            notification, 
            ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
        )
    } else {
        // For Android 13 and below, no type is strictly required for VPN
        startForeground(1, notification)
    }

    try {
        val config = Config.parse(configString.byteInputStream())
        backend.setState(tunnel, Tunnel.State.UP, config)
    } catch (e: Exception) {
            e.printStackTrace()
            reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("VPN_STATUS_CHANGE", "DOWN")
        }

        return START_STICKY
    }

    override fun onDestroy() {
        backend.setState(tunnel, Tunnel.State.DOWN, null)
        super.onDestroy()
    }
}