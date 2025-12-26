import { API } from './api';

export async function login(email: string, password: string ,  deviceId: string,) {
  const res = await API.post('/auth/login', { email, password , deviceId })
  console.log(res.data)
  return res.data 
}

export async function register(
  email: string,
  password: string,
  deviceId: string,
) {
  const res = await API.post('/auth/register', {
    email,
    password,
    deviceId,
  });
  return res.data;
}


export async function me() {
  const res = await API.get('/auth/me')
  return res.data
}
