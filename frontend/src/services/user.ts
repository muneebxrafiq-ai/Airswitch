import api from './api';
import * as SecureStore from 'expo-secure-store';

export const updateProfile = async (name?: string, photoURL?: string | null) => {
    const response = await api.put('/user/profile', { name, photoURL });
    const { user } = response.data;

    // Update local storage
    const storedUserStr = await SecureStore.getItemAsync('user');
    if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr);
        const updatedUserFn = { ...storedUser, ...user };
        await SecureStore.setItemAsync('user', JSON.stringify(updatedUserFn));
    }

    return user;
};
