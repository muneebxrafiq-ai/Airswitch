import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// For Android Emulator, use 10.0.2.2. For iOS/Web localhost is fine.
// If using physical device, replace with your LAN IP (e.g. 192.168.1.x)
const BASE_URL = 'http://192.168.100.64:3000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
