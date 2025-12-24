import { API } from './api'

export async function login(email: string, password: string) {
  const res = await API.post('/auth/login', { email, password })
  console.log(res.data)
  return res.data 
}

export async function register(email: string, password: string) {
  const res = await API.post('/auth/register', { email, password })
  return res.data
}

export async function me() {
  const res = await API.get('/auth/me')
  return res.data
}
