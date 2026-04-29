import api from './axiosConfig';

export const languageService = {
    getLanguages: async (page = 1, limit = 20, searchQuery = '') => {
        const params = { page, limit };
        if (searchQuery) params.name = searchQuery;
        const response = await api.get('/languages', { params });
        return response.data;
    },

    getLanguageByCode: async (isoCode) => {
        const response = await api.get(`/languages/${isoCode}`);
        return response.data;
    },

    getCommonWords: async (page = 1, limit = 20) => {
        const response = await api.get('/languages/common-words', {
            params: { page, limit }
        });
        return response.data;
    },

    getMissingCommonWords: async (isoCode, page = 1, limit = 20) => {
        const response = await api.get(`/languages/${isoCode}/missing-words`, {
            params: { page, limit }
        });
        return response.data;
    },

    getTranslations: async (isoCode, options = {}) => {
        const params = { ...options };
        if (typeof params.coreWordsOnly === 'boolean') {
            params.coreWordsOnly = params.coreWordsOnly.toString();
        }
        const response = await api.get(`/languages/${isoCode}/translations`, { params });
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

    deleteTranslation: async (isoCode, translationId) => {
        const response = await api.delete(
            `/languages/${isoCode}/translations/${translationId}`
        );
        return response.data;
    },
};
