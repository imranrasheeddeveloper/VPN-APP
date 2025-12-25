import { API } from './api'

export async function connectSession(serverId: number) {
  const res = await API.post('/sessions/connect', { serverId })
  return res.data // expect SessionResponseDto
}

export async function disconnectSession(sessionId: number) {
  const res = await API.post('/sessions/disconnect', { sessionId })
  return res.data
}

export async function activeSessions() {
  const res = await API.get('/sessions/active')
  return res.data
}

export async function sendHeartbeat(sessionId: number) {
  return API.post('/sessions/heartbeat', {
    sessionId,
  });
}