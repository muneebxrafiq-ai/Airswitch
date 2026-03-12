import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
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

// Request interceptor — attach access token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Token Auto-Refresh Logic ----
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Response interceptor — auto-refresh on 401/403
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only attempt refresh for auth errors (401/403) and not on the refresh endpoint itself
    const isAuthError = error.response?.status === 401 || error.response?.status === 403;
    const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh');
    const isLoginRequest = originalRequest?.url?.includes('/auth/login');

    if (!isAuthError || isRefreshRequest || isLoginRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject: (err: any) => {
            reject(err);
          },
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call refresh endpoint
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const newAccessToken = data.token;
      const newRefreshToken = data.refreshToken;

      // Persist new tokens
      await SecureStore.setItemAsync('token', newAccessToken);
      await SecureStore.setItemAsync('refreshToken', newRefreshToken);

      // Update the failed request with the new token
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      // Process any queued requests
      processQueue(null, newAccessToken);

      // Retry the original request
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed — clear tokens and let the app handle logout
      processQueue(refreshError, null);
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('user');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
