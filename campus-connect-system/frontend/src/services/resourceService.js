const API_BASE = import.meta.env.VITE_API_URL || '/api';
const getToken = () => localStorage.getItem('campus_connect_token');

const authHeaders = () => {
    const token = getToken();
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
};

const jsonHeaders = () => ({
    'Content-Type': 'application/json',
    ...authHeaders(),
});

const handleRes = async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
};

// ---------- Study Materials API ----------

export const getAllMaterials = async (search = '', subject = '') => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (subject && subject !== 'All') params.set('subject', subject);
    const qs = params.toString();
    const res = await fetch(`${API_BASE}/study-materials${qs ? `?${qs}` : ''}`, {
        headers: authHeaders(),
    });
    return handleRes(res);
};

export const getMyMaterials = async () => {
    const res = await fetch(`${API_BASE}/study-materials/my`, {
        headers: authHeaders(),
    });
    return handleRes(res);
};

export const uploadMaterial = async (formData) => {
    const res = await fetch(`${API_BASE}/study-materials/upload`, {
        method: 'POST',
        headers: authHeaders(), // no Content-Type — let browser set multipart boundary
        body: formData,
    });
    return handleRes(res);
};

export const downloadMaterial = async (id, fileName) => {
    const token = getToken();
    const url = `${API_BASE}/study-materials/${id}/download?token=${token}`;
    
    // Instead of fetch + blob (which can be flaky on some browsers/mobile), 
    // we use a direct link which the browser handles natively.
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'download';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
};

export const rateMaterial = async (id, value) => {
    const res = await fetch(`${API_BASE}/study-materials/${id}/rate`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ value }),
    });
    return handleRes(res);
};

export const reportMaterial = async (id, reason) => {
    const res = await fetch(`${API_BASE}/study-materials/${id}/report`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ reason }),
    });
    return handleRes(res);
};

export const deleteMaterial = async (id) => {
    const res = await fetch(`${API_BASE}/study-materials/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    return handleRes(res);
};

export const summarizeMaterial = async (id) => {
    const res = await fetch(`${API_BASE}/study-materials/${id}/summarize`, {
        method: 'POST',
        headers: authHeaders(),
    });
    return handleRes(res);
};
