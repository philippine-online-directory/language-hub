import api from './axiosConfig';

export const profileService = {
    getMyProfile: async (options = {}) => {
        const response = await api.get('/profile/me', {
            params: options
        });
        return response.data;
    },

    setMyProfile: async (updates) => {
        await api.patch('/profile/me', updates);
    },

    getPublicProfile: async (userId, options = {}) => {
        const response = await api.get(`/profile/${userId}`, {
            params: options
        });
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
