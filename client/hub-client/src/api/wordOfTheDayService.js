import api from './axiosConfig';

let cache = null;

export const wordOfTheDayService = {
    getWordOfTheDay: async () => {
        const today = new Date().toDateString();

        if (cache && cache.date === today) {
            return cache.data;
        }

        const response = await api.get('/word-of-the-day');

        cache = {
            date: today,
            data: response.data
        };

        return cache.data;
    }
};