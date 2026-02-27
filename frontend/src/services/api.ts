import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// API Configuration
// For Android Emulator, use http://10.0.2.2:3000/api
// For iOS/Web localhost, use http://localhost:3000/api
// For physical device, replace with your LAN IP (e.g http://192.168.1.x:3000/api)
let BASE_URL: string | undefined = undefined;

// Fallback logic based on environment
if (!BASE_URL) {
  // Check if running on web
  if (typeof window !== 'undefined' && window.location) {
    BASE_URL = 'http://localhost:3000/api';
  } else {
    // Android Emulator fallback (Host Loopback)
    BASE_URL = 'http://10.0.2.2:3000/api';
  }
}

// Force Override for physical device testing (Fixes fallback issue)
// ADB Reverse (adb reverse tcp:3000 tcp:3000) maps device localhost:3000 to computer:3000
// This is the most reliable method for both Emulators and USB Devices.
// If you are using physical device, you can uncomment the adb reverse in terminal.
// BASE_URL = 'http://localhost:3000/api';

console.log('------------------------------------------');
console.log('API DEBUG INFO:');
console.log('2. Final BASE_URL:', BASE_URL);
console.log('------------------------------------------');

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds timeout
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
