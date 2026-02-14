import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import {
    getUser,
    login as authLogin,
    initiateRegister,
    verifyRegistration,
    logout as authLogout,
    forgotPassword,
    resetPassword
} from '../services/auth';
import { updateProfile } from '../services/user';

interface AuthContextType {
    user: any;
    loading: boolean;
    hasSeenOnboarding: boolean;
    setHasSeenOnboarding: (seen: boolean) => Promise<void>;
    refreshWallet: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    // Modified signUp to just initiate. The actual sign up happens after OTP.
    initiateSignUp: (email: string, password: string, name: string) => Promise<void>;
    completeSignUp: (email: string, otp: string) => Promise<void>;
    signOut: () => Promise<void>;
    requestPasswordReset: (email: string) => Promise<void>;

    completePasswordReset: (email: string, otp: string, newPassword: string) => Promise<void>;
    updateUserProfile: (name?: string, photoURL?: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasSeenOnboarding, setHasSeenOnboardingState] = useState(false);

    useEffect(() => {
        loadUser();
        checkOnboardingStatus();
    }, []);

    const checkOnboardingStatus = async () => {
        try {
            const seen = await SecureStore.getItemAsync('hasSeenOnboarding');
            setHasSeenOnboardingState(seen === 'true');
        } catch (e) {
            console.error('Failed to check onboarding status:', e);
        }
    };

    const setHasSeenOnboarding = async (seen: boolean) => {
        try {
            await SecureStore.setItemAsync('hasSeenOnboarding', seen ? 'true' : 'false');
            setHasSeenOnboardingState(seen);
        } catch (e) {
            console.error('Failed to set onboarding status:', e);
        }
    };

    const loadUser = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) {
                setLoading(false);
                return;
            }

            // Fetch full user data from API
            try {
                const userResponse = await api.get('/auth/me');
                const userData = userResponse.data;

                // Fetch wallet data
                const walletResponse = await api.get('/wallet');
                const wallet = walletResponse.data;

                setUser({ ...userData, wallet });
            } catch (error: any) {
                console.error('Failed to load user data:', error);
                if (error.response?.status === 401) {
                    console.log('Token expired, logging out...');
                    await authLogout();
                    setUser(null);
                }
            }
        } catch (e) {
            console.error('Failed to load user:', e);
            try {
                await authLogout();
            } catch (logoutError) {
                console.error('Error during cleanup:', logoutError);
            }
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        const { user: userData, wallet } = await authLogin(email, password);
        setUser({ ...userData, wallet });
    };

    const initiateSignUp = async (email: string, password: string, name: string) => {
        await initiateRegister(email, password, name);
    };

    const completeSignUp = async (email: string, otp: string) => {
        const { user: userData, wallet } = await verifyRegistration(email, otp);
        setUser({ ...userData, wallet });
    };

    const requestPasswordReset = async (email: string) => {
        await forgotPassword(email);
    };

    const completePasswordReset = async (email: string, otp: string, newPassword: string) => {
        await resetPassword(email, otp, newPassword);
    };

    const refreshWallet = async () => {
        try {
            // Only refresh if user is logged in
            if (!user) {
                return;
            }
            const response = await api.get('/wallet');
            const wallet = response.data;
            setUser((prevUser: any) => prevUser ? { ...prevUser, wallet } : null);
        } catch (error: any) {
            // Only log if it's not a "no auth token" scenario
            if (error.response?.status !== 401) {
                console.error('Failed to refresh wallet:', error.message);
            }
        }
    };

    const updateUserProfile = async (name?: string, photoURL?: string | null) => {
        try {
            setLoading(true);
            const updatedUser = await updateProfile(name, photoURL);
            setUser((prev: any) => ({ ...prev, ...updatedUser }));
        } catch (error) {
            console.error('Failed to update profile:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await authLogout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            hasSeenOnboarding,
            setHasSeenOnboarding,
            refreshWallet,
            signIn,
            initiateSignUp,
            completeSignUp,
            signOut,
            requestPasswordReset,
            completePasswordReset,
            updateUserProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
