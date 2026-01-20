import api from './api';
import * as SecureStore from 'expo-secure-store';

export const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    return user;
};

export const register = async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/register', { email, password, name });
    const { token, user } = response.data;
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    return user;
};

export const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
};

export const getUser = async () => {
    const userStr = await SecureStore.getItemAsync('user');
    return userStr ? JSON.parse(userStr) : null;
};
