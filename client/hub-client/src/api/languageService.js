import api from './axiosConfig';

export const languageService = {
    getLanguages: async (page = 1, limit = 20, searchQuery = '', searchMode = 'name') => {
        const params = { page, limit };
        if (searchQuery && searchMode === 'name') params.name = searchQuery;
        if (searchQuery && searchMode === 'slug') params.slug = searchQuery;
        const response = await api.get('/languages', { params });
        return response.data;
    },

    getLanguageBySlug: async (slug) => {
        const response = await api.get(`/languages/${slug}`);
        return response.data;
    },

    getCommonWords: async (page = 1, limit = 20) => {
        const response = await api.get('/languages/common-words', {
            params: { page, limit }
        });
        return response.data;
    },

    getMissingCommonWords: async (slug, page = 1, limit = 20) => {
        const response = await api.get(`/languages/${slug}/missing-words`, {
            params: { page, limit }
        });
        return response.data;
    },

    getTranslations: async (slug, options = {}) => {
        const params = { ...options };
        if (typeof params.coreWordsOnly === 'boolean') {
            params.coreWordsOnly = params.coreWordsOnly.toString();
        }
        const response = await api.get(`/languages/${slug}/translations`, { params });
        return response.data;
    },

    getTranslationById: async (slug, translationId) => {
        const response = await api.get(`/languages/${slug}/translations/${translationId}`);
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

    updateTranslationStatus: async (slug, translationId, status) => {
        const response = await api.patch(
            `/languages/${slug}/translations/${translationId}`,
            { status }
        );
        return response.data;
    },

    deleteTranslation: async (slug, translationId) => {
        const response = await api.delete(
            `/languages/${slug}/translations/${translationId}`
        );
        return response.data;
    },
};
