const API_BASE = import.meta.env.VITE_API_URL || '/api';
const getToken = () => localStorage.getItem('campus_connect_token');

export const api = async (endpoint, options = {}) => {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...options.headers,
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) headers.Authorization = `Bearer ${token}`;

  // automatically stringify body if it's a plain object
  let body = options.body;
  if (
    body &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob)
  ) {
    body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers, body });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
};
