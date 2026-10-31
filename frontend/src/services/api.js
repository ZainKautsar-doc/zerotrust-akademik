export const GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL !== undefined 
  ? import.meta.env.VITE_API_GATEWAY_URL 
  : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? '' : 'http://127.0.0.1:3000');

export async function apiRequest(endpoint, options = {}, authContext = {}) {
  const { token, deviceId, simulatedHour } = authContext;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (deviceId) {
    headers['X-Device-ID'] = deviceId;
  }
  if (simulatedHour !== undefined && simulatedHour !== null && simulatedHour !== '') {
    headers['X-Simulated-Hour'] = simulatedHour;
  }

  const res = await fetch(`${GATEWAY_URL}${endpoint}`, {
    ...options,
    headers
  });

  const contentType = res.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const errorMsg = data.error || (typeof data === 'string' ? data : 'Request gagal');
    throw new Error(errorMsg);
  }

  return data;
}
