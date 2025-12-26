import { API } from './api';

export async function verifySubscription(
  productId: string,
  purchaseToken: string,
) {
  const res = await API.post('/subscriptions/verify', {
    productId,
    purchaseToken,
  });
  return res.data;
}

export async function restoreSubscription(purchaseToken: string) {
  const res = await API.post('/subscriptions/restore', {
    purchaseToken,
  });
  return res.data;
}

export async function getMySubscription() {
  const res = await API.get('/subscriptions/me');
  return res.data;
}
