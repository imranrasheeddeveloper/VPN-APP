package com.securenest.vpn.vpn

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // This is triggered when the phone finishes booting
        if (Intent.ACTION_BOOT_COMPLETED == intent.action) {
            Log.d("SecureNestBoot", "Device rebooted. Checking Always-On status...")
            
            // To truly "Always-On", you need to store the last 'Connect' state 
            // in SharedPreferences. If it was ON, we start it here:
            val intent = Intent(context, SecureNestVpnService::class.java)
            // Note: You would need to retrieve your stored config string here
            // intent.putExtra("config", storedConfig)
            
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }
    }
}