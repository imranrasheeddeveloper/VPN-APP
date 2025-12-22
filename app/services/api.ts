import axios from 'axios'
import { getToken } from '../storage/token'

export const API = axios.create({
  baseURL: 'https://YOUR_BACKEND_URL/api',
  timeout: 15000,
})

API.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
