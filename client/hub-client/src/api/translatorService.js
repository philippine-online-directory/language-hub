import api from './axiosConfig';

export const translatorService = {
    translate: async (isoCode, word, direction) => {
        const response = await api.get(`/translate/${isoCode}`, {
            params: { word, direction }
        });
        return response.data;
    }
};