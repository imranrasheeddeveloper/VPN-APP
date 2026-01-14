import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'SNVPN_JWT';

export const setToken = async (token: string) => {
  await AsyncStorage.setItem(KEY, token);
};

export const getToken = async () => {
  return await AsyncStorage.getItem(KEY);
};

export const clearToken = async () => {
  await AsyncStorage.removeItem(KEY);
};
