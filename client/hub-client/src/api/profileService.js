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

    searchUsers: async (page = 1, limit = 20, query = '') => {
        const params = { page, limit };
        if (query) {
            params.name = query;
        }
        const response = await api.get('/profile', { params });
        return response.data;
    },
};