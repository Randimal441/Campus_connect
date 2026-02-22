import { api } from './api';
import { setToken, removeToken } from '../utils/tokenHelper';

export const signup = async (data) => {
  const res = await api('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (res.token) setToken(res.token);
  return res;
};

export const login = async (data) => {
  const res = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  setToken(res.token);
  return res;
};

export const logout = () => {
  removeToken();
};

export const getMe = async () => {
  return api('/auth/me');
};
