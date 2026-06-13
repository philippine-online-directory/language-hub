import api from './axiosConfig';

export const importBatchService = {
    createImportBatch: async ({ languageId, file, rightsConfirmed }) => {
        const formData = new FormData();
        formData.append('languageId', languageId);
        formData.append('rightsConfirmed', rightsConfirmed ? 'true' : 'false');
        formData.append('file', file);

        const response = await api.post('/import-batches', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    getMyImportBatches: async (page = 1, limit = 10) => {
        const response = await api.get('/import-batches', {
            params: { page, limit }
        });
        return response.data;
    },

    getAdminImportBatches: async ({ page = 1, limit = 20, status, languageId } = {}) => {
        const params = { page, limit };
        if (status) params.status = status;
        if (languageId) params.languageId = languageId;

        const response = await api.get('/import-batches/admin', { params });
        return response.data;
    },

    getImportBatch: async (batchId) => {
        const response = await api.get(`/import-batches/${batchId}`);
        return response.data;
    },

    approveImportBatch: async (batchId) => {
        const response = await api.patch(`/import-batches/admin/${batchId}/approve`);
        return response.data;
    },

    rejectImportBatch: async (batchId) => {
        const response = await api.patch(`/import-batches/admin/${batchId}/reject`);
        return response.data;
    },

    rollbackImportBatch: async (batchId) => {
        const response = await api.patch(`/import-batches/admin/${batchId}/rollback`);
        return response.data;
    },
};
