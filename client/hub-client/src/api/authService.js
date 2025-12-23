import api from './axiosConfig';

async function register(userData){
    const response = await api.post('/register', userData);
    return response.data;
}

async function login(credentials){
    const response = await api.post('/login', credentials);
    if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
    }
    return response.data;
}

async function logout(){
    localStorage.removeItem('authToken');
}

async function getToken(){
    return localStorage.getItem('authToken');
}

async function isAuthenticated(){
    return !!localStorage.getItem('authToken');
}
export const authService = {
    register,
    login,
    logout,
    getToken,
    isAuthenticated
}