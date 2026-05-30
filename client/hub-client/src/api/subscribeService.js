import api from './axiosConfig';

export const subscribeService = {
    subscribeGuest: async (email) => {
        await api.post('/subscribe', { email });
    },
};
