import * as SecureStore from 'expo-secure-store'

const KEY = 'SNVPN_JWT'

export const setToken = (token: string) => SecureStore.setItemAsync(KEY, token)
export const getToken = () => SecureStore.getItemAsync(KEY)
export const clearToken = () => SecureStore.deleteItemAsync(KEY)
