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
import com.facebook.react.bridge.Arguments
import com.wireguard.android.backend.Statistics

class SecureNestVpnService : VpnService() {

    private val channelId = "vpn_channel"
    private val notificationId = 1
    private lateinit var backend: GoBackend
    private val tunnel = WgTunnel()
    private var lastConfig: String? = null
    private var vpnInterface: ParcelFileDescriptor? = null
    private val statsHandler = Handler(Looper.getMainLooper())
    private var lastRxBytes: Long = 0
    private var lastTxBytes: Long = 0


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
            // 🔥 FULL CLEANUP (CRITICAL)
            vpnInterface?.close()
            vpnInterface = null
            backend.setState(tunnel, Tunnel.State.DOWN, null)

            // 🔑 Parse WireGuard config
            val config = Config.parse(
                ByteArrayInputStream(configString.toByteArray())
            )

            val builder = Builder()
                .setSession("SecureNest")

            // 🔒 Do NOT tunnel app traffic into itself
            builder.addDisallowedApplication(packageName)

            // 🌍 FULL TUNNEL (MOST IMPORTANT FIX)
            builder.addRoute("0.0.0.0", 0)

            // 🌐 DNS (MANDATORY)
            builder.addDnsServer("1.1.1.1")
            builder.addDnsServer("8.8.8.8")

            // 🧠 USE ADDRESS FROM CONFIG (NO HARDCODE)
            config.`interface`.addresses.forEach { inetNetwork ->
                val cidr = inetNetwork.toString() // e.g. "10.0.0.2/32"
                val parts = cidr.split("/")
                val ip = parts[0]
                val prefix = parts[1].toInt()

                builder.addAddress(ip, prefix)
            }


            vpnInterface = builder.establish()

            if (vpnInterface == null) {
                sendStatus("DOWN")
                stopSelf()
                return START_NOT_STICKY
            }

            // ⏳ Small delay ensures interface is ready
            Handler(Looper.getMainLooper()).postDelayed({
                try {
                    backend.setState(tunnel, Tunnel.State.UP, config)
                    vpnState = "UP"
                    sendStatus("UP")

                    // 📊 Start live stats
                    statsHandler.post(statsRunnable)

                } catch (e: Exception) {
                    Log.e(TAG, "WireGuard failed: ${e.message}")
                    sendStatus("DOWN")
                    stopSelf()
                }
            }, 800)

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

    private val statsRunnable = object : Runnable {
        override fun run() {
            try {
                val stats: Statistics = backend.getStatistics(tunnel)

                val rxBytes = stats.totalRx()
                val txBytes = stats.totalTx()

                val downSpeed = rxBytes - lastRxBytes
                val upSpeed = txBytes - lastTxBytes

                lastRxBytes = rxBytes
                lastTxBytes = txBytes

                val params = Arguments.createMap()
                params.putDouble("down", downSpeed.toDouble())
                params.putDouble("up", upSpeed.toDouble())

                reactContext
                    ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit("VPN_STATS", params)

            } catch (e: Exception) {
                Log.e(TAG, "Stats error: ${e.message}")
            }

            statsHandler.postDelayed(this, 1000)
        }
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
        statsHandler.removeCallbacks(statsRunnable)
        disconnectTunnel()
        super.onRevoke()
    }

    override fun onDestroy() {
        Log.i(TAG, "Service destroyed")
        statsHandler.removeCallbacks(statsRunnable)
        disconnectTunnel()
        super.onDestroy()
    }

    private fun disconnectTunnel() {
        try {
            backend.setState(tunnel, Tunnel.State.DOWN, null)
        } catch (e: Exception) {
            Log.e(TAG, "Error during disconnect: ${e.message}")
        }
        statsHandler.removeCallbacks(statsRunnable)
        lastRxBytes = 0
        lastTxBytes = 0
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