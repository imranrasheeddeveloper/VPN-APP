import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { getMySubscription } from '../services/subscriptions';
import { getToken } from '../storage/token';

type JwtPayload = {
  sub: string;
  email?: string;
  plan?: 'free' | 'premium';
};

type Subscription = {
  endAt: string;
};

export function useAuth() {
  const [state, setState] = useState({
    email: null as string | null,
    plan: 'free' as 'free' | 'premium',
    expiresAt: null as string | null,
  });

  const load = async () => {
    const token = await getToken();

    if (!token) {
      setState({
        email: null,
        plan: 'free',
        expiresAt: null,
      });
      return;
    }

    try {
      const payload = jwtDecode<JwtPayload>(token);

      let expiresAt: string | null = null;

      if (payload.plan === 'premium') {
        const sub: Subscription | null = await getMySubscription();
        expiresAt = sub?.endAt ?? null;
      }

      setState({
        email: payload.email ?? null,
        plan: payload.plan ?? 'free',
        expiresAt,
      });
    } catch {
      setState({
        email: null,
        plan: 'free',
        expiresAt: null,
      });
    }
  };

  useEffect(() => {
    load();

    const listener = DeviceEventEmitter.addListener(
      'AUTH_TOKEN_CHANGED',
      load,
    );

    return () => listener.remove();
  }, []);

  return {
    email: state.email,
    plan: state.plan,
    expiresAt: state.expiresAt,
    isLoggedIn: !!state.email, // ✅ ADD THIS
  };

}
