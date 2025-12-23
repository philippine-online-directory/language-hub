import api from './axiosConfig';

export const contributionService = {
    getUserContributions: async () => {
        const response = await api.get('/contributions');
        return response.data;
    },

    contributeTranslation: async (translationData) => {
        const response = await api.post('/contributions', translationData);
        return response.data;
    },
};