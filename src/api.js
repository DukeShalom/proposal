const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = await res.json().catch(() => ({ success: false, error: 'Invalid JSON response' }));

  if (!res.ok || !json.success) {
    throw new Error(json.error || json.message || `HTTP ${res.status}`);
  }

  return json;
}

// Clients
export const getClients = () => request('/clients');
export const getClient = (id) => request(`/clients/${id}`);
export const createClient = (data) => request('/clients', { method: 'POST', body: data });
export const updateClient = (id, data) => request(`/clients/${id}`, { method: 'PUT', body: data });
export const deleteClient = (id) => request(`/clients/${id}`, { method: 'DELETE' });

// Services
export const getServices = () => request('/services');
export const createService = (data) => request('/services', { method: 'POST', body: data });
export const updateService = (id, data) => request(`/services/${id}`, { method: 'PUT', body: data });
export const deleteService = (id) => request(`/services/${id}`, { method: 'DELETE' });

// Documents
export const getDocuments = () => request('/documents');
export const getDocument = (id) => request(`/documents/${id}`);
export const createDocument = (data) => request('/documents', { method: 'POST', body: data });
export const updateDocument = (id, data) => request(`/documents/${id}`, { method: 'PUT', body: data });
export const deleteDocument = (id) => request(`/documents/${id}`, { method: 'DELETE' });
export const sendDocument = (id) => request(`/documents/${id}/send`, { method: 'POST' });

// Sign
export const getSignDocument = (token) => request(`/sign/${token}`);
export const signDocument = (token, data) => request(`/sign/${token}`, { method: 'POST', body: data });
