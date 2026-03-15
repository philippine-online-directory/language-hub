import api from './axiosConfig';

export const wordOfTheDayService = {
    getWordOfTheDay: async () => {
        const response = await api.get('/word-of-the-day');
        return response.data;
    }
};