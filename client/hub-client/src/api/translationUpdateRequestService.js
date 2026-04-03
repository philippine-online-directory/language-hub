import api from './axiosConfig';

export const translationUpdateRequestService = {
  addTranslationUpdateRequest: async (translationId, languageId, proposedData) => {
    const response = await api.post('/translation-requests', {
      translationId,
      languageId,
      proposedData,
    });
    return response.data;
  },

  getTranslationUpdateRequests: async (languageId, page = 1, limit = 20) => {
    const response = await api.get('/translation-requests', {
      params: { languageId, page, limit },
    });
    return response.data;
  },

  acceptTranslationUpdateRequest: async (requestId) => {
    const response = await api.patch(`/translation-requests/${requestId}/accept`);
    return response.data;
  },

  deleteTranslationUpdateRequest: async (requestId) => {
    const response = await api.delete(`/translation-requests/${requestId}`);
    return response.data;
  },
};
