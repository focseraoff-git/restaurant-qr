
import axios from 'axios';

const getBaseUrl = () => {
    let url = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
    if (!url.endsWith('/api')) {
        url += '/api';
    }
    return url;
};

const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
