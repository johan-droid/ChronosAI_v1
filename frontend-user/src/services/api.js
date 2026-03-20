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

export default api;