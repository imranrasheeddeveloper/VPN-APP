import { jwtDecode } from 'jwt-decode'
import { useEffect, useState } from 'react'
import { DeviceEventEmitter } from 'react-native'
import { getToken } from '../storage/token'

type JwtPayload = {
  sub: string
  email?: string
  plan?: 'free' | 'premium'
}

export function useAuth() {
  const [state, setState] = useState({
    isLoggedIn: false,
    email: null as string | null,
    plan: 'free' as 'free' | 'premium',
  })

  const load = async () => {
    const token = await getToken()
    if (!token) {
      setState({ isLoggedIn: false, email: null, plan: 'free' })
      return
    }

    try {
      const payload = jwtDecode<JwtPayload>(token)

      setState({
        isLoggedIn: !!payload.email,
        email: payload.email ?? null,
        plan: payload.plan ?? 'free',
      })
    } catch {
      setState({ isLoggedIn: false, email: null, plan: 'free' })
    }
  }

  useEffect(() => {
    load()
    const sub = DeviceEventEmitter.addListener('AUTH_TOKEN_CHANGED', load)
    return () => sub.remove()
  }, [])

  return state
}
