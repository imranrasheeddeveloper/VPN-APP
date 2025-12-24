import { API } from '../services/api'

export async function registerDevice(deviceId: string, platform: string) {
  const res = await API.post('/devices/register', { deviceId, platform })
  return res.data
}
