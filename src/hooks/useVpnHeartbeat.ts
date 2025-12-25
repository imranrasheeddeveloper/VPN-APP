import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { sendHeartbeat } from '../services/sessions';

export function useVpnHeartbeat(
  connected: boolean,
  sessionId?: number | null,
) {
  // ✅ Use number for React Native
  const intervalRef = useRef<number | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!connected || !sessionId) return;

    const start = () => {
      if (intervalRef.current !== null) return;

      intervalRef.current = setInterval(() => {
        sendHeartbeat(sessionId).catch(() => {
          // swallow errors — heartbeat must never crash UI
        });
      }, 30_000) as unknown as number;
    };

    const stop = () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    start();

    const subscription = AppState.addEventListener(
      'change',
      nextState => {
        if (
          appState.current.match(/inactive|background/) &&
          nextState === 'active'
        ) {
          start();
        } else if (nextState !== 'active') {
          stop();
        }

        appState.current = nextState;
      },
    );

    return () => {
      stop();
      subscription.remove();
    };
  }, [connected, sessionId]);
}
