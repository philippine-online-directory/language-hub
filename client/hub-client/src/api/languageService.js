import api from './axiosConfig';

export const languageService = {
    getLanguages: async (page = 1, limit = 20, searchQuery = '') => {
        const params = { page, limit };
        if (searchQuery) {
            params.name = searchQuery;
        }
        const response = await api.get('/languages', { params });
        return response.data;
    },

    getLanguageByCode: async (isoCode) => {
        const response = await api.get(`/languages/${isoCode}`);
        return response.data;
    },

    async getTranslations(isoCode, options = {}) {
        const response = await api.get(
            `/languages/${isoCode}/translations`,
            { params: options }
        );

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