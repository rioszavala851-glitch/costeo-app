import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

// Attach token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle 401 responses globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Optionally: redirect to login or clear token
            console.warn('Unauthorized - token may be invalid or expired');
        }
        return Promise.reject(error);
    }
);

export default api;
