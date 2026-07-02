import { useState, useEffect } from 'react';
import { authService } from '../api/authService';
import { profileService } from '../api/profileService';
import { AuthContext } from './AuthContextValue';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const bootstrapAuth = async () => {
            const token = authService.getToken();

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const userData = await profileService.getMyProfile();
                setUser(userData);
            } catch (err) {
                console.error('Auth bootstrap failed:', err);
                authService.logout();
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        bootstrapAuth();
    }, []);

    const login = async (credentials) => {
        const response = await authService.login(credentials);
        const userData = await profileService.getMyProfile();
        setUser(userData);
        return response;
    };

    const register = async (userData) => {
        return authService.register(userData);
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
