import { API } from './api';

export async function registerDevice(deviceId: string, platform: string) {
  const res = await API.post('/devices/register', { deviceId, platform })
  return res.data
}
export async function registerDevicePushToken(pushToken: string) {
  const res = await API.post('/devices/push-token', {
    pushToken,
  });
  return res.data;
}

