import api from './axiosConfig';

export const contributionService = {
    getUserContributions: async (page = 1, limit = 20) => {
        const response = await api.get('/contributions', {
            params: { page, limit }
        });
        return response.data;
    },

    contributeTranslation: async (translationData) => {
        const response = await api.post('/contributions', translationData);
        return response.data;
    },
};