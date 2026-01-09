package com.securenest.vpn.billing

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class BillingPackage : ReactPackage {
  override fun createNativeModules(rc: ReactApplicationContext): List<NativeModule> {
    return listOf(NativeBillingModule(rc))
  }

  override fun createViewManagers(rc: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}
