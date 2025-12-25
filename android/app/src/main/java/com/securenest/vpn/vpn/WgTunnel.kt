package com.securenest.vpn.vpn

import com.wireguard.android.backend.Tunnel
import com.facebook.react.modules.core.DeviceEventManagerModule

class WgTunnel : Tunnel {

    override fun getName(): String = "SecureNestVpn"

    override fun onStateChange(newState: Tunnel.State) {
        val status = when (newState) {
            Tunnel.State.UP -> "UP"
            Tunnel.State.DOWN -> "DOWN"
            else -> return
        }

        SecureNestVpnService.vpnState = status

        SecureNestVpnService.reactContext
            ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("VPN_STATUS_CHANGE", status)
    }
}
