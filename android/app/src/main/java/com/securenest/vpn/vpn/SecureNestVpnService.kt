package com.securenest.vpn.vpn

import android.content.Intent
import android.net.VpnService
import com.wireguard.android.backend.GoBackend
import com.wireguard.android.backend.Tunnel
import com.wireguard.config.Config
import com.facebook.react.bridge.ReactApplicationContext

class SecureNestVpnService : VpnService() {
    private val backend by lazy { GoBackend(this) }
    private val tunnel = WgTunnel()

    companion object {
        // Static reference to talk to JavaScript
        var reactContext: ReactApplicationContext? = null
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val configString = intent?.getStringExtra("config") ?: return START_NOT_STICKY
        
        try {
            val config = Config.parse(configString.byteInputStream())
            backend.setState(tunnel, Tunnel.State.UP, config)
        } catch (e: Exception) {
            e.printStackTrace()
        }
        
        return START_STICKY
    }

    override fun onDestroy() {
        backend.setState(tunnel, Tunnel.State.DOWN, null)
        super.onDestroy()
    }
}