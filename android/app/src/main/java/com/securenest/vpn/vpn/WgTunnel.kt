package com.securenest.vpn.vpn

import com.wireguard.android.backend.Tunnel
import com.facebook.react.modules.core.DeviceEventManagerModule

class WgTunnel : Tunnel {
    override fun getName(): String = "SecureNestVpn"

    override fun onStateChange(newState: Tunnel.State) {
        // newState can be UP, DOWN, or TOGGLE
        val statusString = newState.name 

        // Send the "shout" to JavaScript
        SecureNestVpnService.reactContext
            ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("VPN_STATUS_CHANGE", statusString)
    }
}