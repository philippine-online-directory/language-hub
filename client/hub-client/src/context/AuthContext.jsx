import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/authService';
import { profileService } from '../api/profileService';

export function useAuth(){
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }){
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            if (authService.isAuthenticated()) {
                try {
                    const userData = await profileService.getMyProfile();
                    setUser(userData);
                } 
                catch (error) {
                    console.error('Failed to load user:', error);
                    authService.logout();
                }
            }
            setLoading(false);
        }

        loadUser();
    }, []);

    const login = async (credentials) => {
        const response = await authService.login(credentials);
        const userData = await profileService.getMyProfile();
        setUser(userData);
        return response;
    };

    const register = async (userData) => {
        const response = await authService.register(userData);
        return response;
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

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}