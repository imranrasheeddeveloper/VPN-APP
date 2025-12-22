import { API } from './api'

export async function listServers() {
  const res = await API.get('/servers') // JwtAuthGuard protected
  return res.data
}
