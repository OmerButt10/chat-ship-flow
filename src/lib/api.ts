import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const instance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export function setAuthToken(token: string | null) {
  if (token) instance.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete instance.defaults.headers.common.Authorization;
}

export default instance;
