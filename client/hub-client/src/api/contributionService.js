import axios from 'axios';
import api from './axiosConfig';

export const contributionService = {
    getUserContributions: async (page = 1, limit = 20) => {
        const response = await api.get('/contributions', {
            params: { page, limit }
        });
        return response.data;
    },

    contributeTranslation: async (translationData) => {
        const response = await api.post('/contributions', translationData);
        return response.data;
    },

    getAudioUploadUrl: async (fileName, contentType) => {
        const response = await api.post('/audio/upload-url', {
            fileName,
            contentType
        });
        return response.data; 
    },

    uploadAudioToStorage: async (presignedUrl, audioFile) => {
        await axios.put(presignedUrl, audioFile, {
            headers: {
                'Content-Type': audioFile.type,
            },
            transformRequest: [(data) => data],
        });
    },

    uploadAudio: async (audioFile) => {
        try {
            const { uploadUrl, storageKey } = await contributionService.getAudioUploadUrl(
                audioFile.name,
                audioFile.type
            );

            await contributionService.uploadAudioToStorage(uploadUrl, audioFile);

            return storageKey;
        } catch (error) {
            console.error('Error uploading audio:', error);
            throw new Error(error.response?.data?.message || 'Failed to upload audio file');
        }
    },
};