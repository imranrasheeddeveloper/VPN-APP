import { useEffect, useState } from 'react';
import { getAppSettings } from '../services/subscriptions';

export function useAppSettings() {
  const [loading, setLoading] = useState(true);
  const [isInAppPurchaseEnabled, setEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await getAppSettings();
        if (mounted) {
          setEnabled(!!data.isInAppPurchaseEnabled);
        }
      } catch {
        if (mounted) setEnabled(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { isInAppPurchaseEnabled, loading };
}
