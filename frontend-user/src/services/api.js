import axios from 'axios';

// IMPORTANT: If localhost blocks your requests inside Project IDX, 
// replace this with your public port 5000 IDX preview URL (e.g., 'https://5000-idx-....cloudworkstations.dev/api')
const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Automatically attach token for every request (safe fallback for page reloads)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API response error:', error.response?.status, error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default api;