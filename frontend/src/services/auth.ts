import api from './api';
import * as SecureStore from 'expo-secure-store';

export const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user, wallet } = response.data;
    await SecureStore.setItemAsync('token', token);
    // Only store minimal user data to avoid SecureStore size limit
    const minimalUser = { id: user.id, email: user.email, name: user.name };
    await SecureStore.setItemAsync('user', JSON.stringify(minimalUser));
    return { user, wallet };
};

// Initiates registration (sends OTP)
export const initiateRegister = async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data;
};

// Verifies registration OTP and creates user
export const verifyRegistration = async (email: string, otp: string) => {
    const response = await api.post('/auth/verify-registration', { email, otp });
    const { token, user, wallet } = response.data;
    await SecureStore.setItemAsync('token', token);
    // Only store minimal user data to avoid SecureStore size limit
    const minimalUser = { id: user.id, email: user.email, name: user.name };
    await SecureStore.setItemAsync('user', JSON.stringify(minimalUser));
    return { token, user, wallet };
};

// Sends OTP for password reset
export const forgotPassword = async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

// Resets password using OTP
export const resetPassword = async (email: string, otp: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { email, otp, newPassword });
    return response.data;
};

export const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
};

export const getUser = async () => {
    const userStr = await SecureStore.getItemAsync('user');
    return userStr ? JSON.parse(userStr) : null;
};
