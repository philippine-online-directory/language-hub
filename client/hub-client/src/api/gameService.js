import api from './axiosConfig';

export const gameService = {
    getGameSessions: async (setId) => {
        const response = await api.get(`/sets/${setId}/games`);
        return response.data;
    },

    uploadGameSession: async (setId, sessionData) => {
        const response = await api.post(`/sets/${setId}/games`, sessionData);
        return response.data;
    },
};