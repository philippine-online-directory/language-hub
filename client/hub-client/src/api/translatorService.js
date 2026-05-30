import api from './axiosConfig';

export const translatorService = {
    translate: async (slug, word, direction) => {
        const response = await api.get(`/translate/${slug}`, {
            params: { word, direction }
        });
        return response.data;
    }
};