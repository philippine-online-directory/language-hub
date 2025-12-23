import api from './axiosConfig';

export const profileService = {
    getMyProfile: async () => {
        const response = await api.get('/profile/me');
        return response.data;
    },

    getPublicProfile: async (userId) => {
        const response = await api.get(`/profile/${userId}`);
        return response.data;
    },

    searchUsers: async (query) => {
        const response = await api.get('/profile', {
        params: { q: query },
        });
        return response.data;
    },
};