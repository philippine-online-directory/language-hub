import api from './axiosConfig';

export const languageService = {
    getLanguages: async (searchQuery = '') => {
        const response = await api.get('/languages', {
        params: searchQuery ? { name: searchQuery } : {},
        });
        return response.data;
    },

    getLanguageByCode: async (isoCode) => {
        const response = await api.get(`/languages/${isoCode}`);
        return response.data;
    },

    getTranslations: async (isoCode) => {
        const response = await api.get(`/languages/${isoCode}/translations`);
        return response.data;
    },

    getTranslationById: async (isoCode, translationId) => {
        const response = await api.get(`/languages/${isoCode}/translations/${translationId}`);
        return response.data;
    },

    addLanguage: async (languageData) => {
        const response = await api.post('/languages', languageData);
        return response.data;
    },

    updateLanguage: async (languageId, languageData) => {
        const response = await api.put(`/languages/${languageId}`, languageData);
        return response.data;
    },

    deleteLanguage: async (languageId) => {
        const response = await api.delete(`/languages/${languageId}`);
        return response.data;
    },

    updateTranslationStatus: async (isoCode, translationId, status) => {
        const response = await api.patch(
        `/languages/${isoCode}/translations/${translationId}`,
        { status }
        );
        return response.data;
    },
};