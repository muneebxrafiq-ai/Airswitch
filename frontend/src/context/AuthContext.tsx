import React, { createContext, useState, useEffect, useContext } from 'react';
import { getUser, login as authLogin, register as authRegister, logout as authLogout } from '../services/auth';

interface AuthContextType {
    user: any;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, name: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const storedUser = await getUser();
            if (storedUser) setUser(storedUser);
        } catch (e) {
            console.log('Failed to load user', e);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        const userData = await authLogin(email, password);
        setUser(userData);
    };

    const signUp = async (email: string, password: string, name: string) => {
        const userData = await authRegister(email, password, name);
        setUser(userData);
    };

    const signOut = async () => {
        await authLogout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
