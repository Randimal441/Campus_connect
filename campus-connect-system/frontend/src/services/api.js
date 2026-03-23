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

  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers, body });
  } catch (error) {
    throw new Error('Cannot reach server. Please make sure backend is running.');
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : {};
  const textFallback = !isJson ? await res.text().catch(() => '') : '';

  if (!res.ok) {
    const fallbackMessage = textFallback
      ? `Request failed (${res.status}): ${textFallback.slice(0, 140)}`
      : `Request failed (${res.status})`;
    throw new Error(data.message || fallbackMessage);
  }
  return data;
};
