import * as SecureStore from 'expo-secure-store'

const DEVICE_ID_KEY = 'device_id'

// RFC-4122 compliant UUID v4 (format-correct)
function generateUUIDv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export async function getDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY)
  if (existing) return existing

  const uuid = generateUUIDv4()
  await SecureStore.setItemAsync(DEVICE_ID_KEY, uuid)
  return uuid
}
