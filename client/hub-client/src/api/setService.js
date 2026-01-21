import api from './axiosConfig';

export const setService = {
    getUserSets: async () => {
        const response = await api.get('/sets');
        return response.data;
    },

    searchPublicSets: async (query = '') => {
        const response = await api.get('/sets/public', {
            params: query ? { name: query } : {},
        });
        return response.data;
    },

    getSetById: async (setId) => {
        const response = await api.get(`/sets/${setId}`);
        return response.data;
    },

    createSet: async (setData) => {
        const response = await api.post('/sets', setData);
        return response.data;
    },

    updateSet: async (setId, setData) => {
        const response = await api.put(`/sets/${setId}`, setData);
        return response.data;
    },

    publishSet: async (setId, setData) => {
        const response = await api.put(`/sets/${setId}`, setData);
        return response.data;
    },

    getSetWords: async (setId) => {
        const response = await api.get(`/sets/${setId}/words`);
        return response.data;
    },

    deleteSet: async (setId) => {
        const response = await api.delete(`/sets/${setId}`);
        return response.data;
    },

    addTranslationToSet: async (setId, translationId) => {
        const response = await api.post(`/sets/${setId}/translations`, {
            translationId,
        });
        return response.data;
    },

    removeTranslationFromSet: async (setId, translationId) => {
        const response = await api.delete(`/sets/${setId}/translations/${translationId}`);
        return response.data;
    },
};