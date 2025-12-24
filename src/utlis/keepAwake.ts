import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake'

export async function enableKeepAwakeSafe() {
  try {
    await activateKeepAwake()
  } catch (e) {
    // ❌ Ignore — OS may block this
    console.log('ℹ️ Keep awake not available')
  }
}

export async function disableKeepAwakeSafe() {
  try {
    await deactivateKeepAwake()
  } catch {
    // ignore
  }
}
