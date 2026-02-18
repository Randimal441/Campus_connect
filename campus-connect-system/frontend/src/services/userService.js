import { api } from './api';

export const getProfile = () => api('/users/profile');
export const updateProfile = (data) =>
  api('/users/profile', { method: 'PATCH', body: JSON.stringify(data) });
