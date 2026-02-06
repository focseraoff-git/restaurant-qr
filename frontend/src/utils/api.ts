
import axios from 'axios';

const getBaseUrl = () => {
    // 1. Explicit Env Var (e.g. set in Vercel UI)
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

    // 2. Production (Relative path for same-domain deployment)
    if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
        return '/api';
    }

    // 3. Local Development Fallback
    return 'http://localhost:3002/api';
};

const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
