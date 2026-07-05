import api from './axiosConfig';

export const translatorService = {
    translate: async (slug, word, direction, signal) => {
        const response = await api.get(`/translate/${slug}`, {
            params: { word, direction },
            signal
        });
        return response.data;
    }
};
