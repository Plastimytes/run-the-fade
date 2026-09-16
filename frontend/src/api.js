const isLocalHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
const BASE_URL = import.meta.env.VITE_API_URL || (isLocalHost ? 'http://localhost:4000/api' : 'https://run-the-fade.onrender.com/api');
export const ORIGIN_URL = BASE_URL.replace(/\/api\/?$/, '');

function getToken() {
  return localStorage.getItem('rtf_token');
}

export function photoSrc(path) {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${ORIGIN_URL}${path}`;
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('API unavailable — check the backend connection and VITE_API_URL.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export const api = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),

  getAllFighters: () => request('/fighters'),
  getMe: () => request('/fighters/me'),
  updateMe: (payload) => request('/fighters/me', { method: 'PUT', body: payload }),
  getFighter: (id) => request(`/fighters/${id}`),
  uploadPhoto: async (file) => {
    const form = new FormData();
    form.append('photo', file);
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/fighters/me/photo`, { method: 'POST', headers, body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },
  getNearby: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/fighters/nearby${qs ? `?${qs}` : ''}`);
  },

  swipe: (swiped_id, direction) => request('/swipes', { method: 'POST', body: { swiped_id, direction } }),
  ensureMatch: (user_id) => request('/swipes/ensure-match', { method: 'POST', body: { user_id } }),
  getMatches: () => request('/swipes/matches'),

  createLocation: (payload) => request('/locations', { method: 'POST', body: payload }),
  getAllLocations: () => request('/locations'),
  getMyLocations: () => request('/locations/mine'),

  proposeFight: (payload) => request('/fights', { method: 'POST', body: payload }),
  getMyFights: () => request('/fights/mine'),
  getPendingApprovals: () => request('/fights/pending-approval'),
  approveFight: (id) => request(`/fights/${id}/approve`, { method: 'POST' }),
  declineFight: (id) => request(`/fights/${id}/decline`, { method: 'POST' }),
  confirmResult: async (id, { winner_id, loser_id, is_draw, notes, photo }) => {
    const form = new FormData();
    if (is_draw) form.append('is_draw', 'true');
    if (winner_id) form.append('winner_id', winner_id);
    if (loser_id) form.append('loser_id', loser_id);
    if (notes) form.append('notes', notes);
    if (photo) form.append('photo', photo);
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/fights/${id}/result`, { method: 'POST', headers, body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  },

  getRankings: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/rankings${qs ? `?${qs}` : ''}`);
  },

  getMessages: (matchId) => request(`/matches/${matchId}/messages`),
  sendMessage: (matchId, body) => request(`/matches/${matchId}/messages`, { method: 'POST', body: { body } }),

  getNotifications: () => request('/notifications'),
  getUnreadCount: () => request('/notifications/unread-count'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'POST' }),
};

export function setToken(token) {
  if (token) localStorage.setItem('rtf_token', token);
  else localStorage.removeItem('rtf_token');
}
export { getToken };
