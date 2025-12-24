import axios from 'axios'
import { getToken } from '../storage/token'

export const API = axios.create({
  baseURL: 'http://157.173.126.219:4000/api',
  timeout: 15000,
})

API.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
