import auth from '../middleware/auth.js'
import storageService from '../services/storageService.js'
import { body, matchedData } from 'express-validator'
import validationErrorCheck from '../middleware/expressValidate.js'

const validateUploadRequest = [
    body('fileName').notEmpty()
        .withMessage('fileName is required')
        .trim(),
    body('contentType').notEmpty()
        .withMessage('contentType is required')
        .isIn(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a'])
        .withMessage('Invalid audio content type')
]

const getUploadUrl = [
    auth,
    validateUploadRequest,
    validationErrorCheck,
    async (req, res, next) => {
        try {
            const { fileName, contentType } = matchedData(req);

            const storageKey = storageService.generateStorageKey(fileName);

            const uploadUrl = await storageService.generateUploadUrl(storageKey, contentType);

            res.status(200).json({
                uploadUrl,
                storageKey, 
            });
        } 
        catch (err) {
            next(err)
        }
    }
]

const audioController = {
    getUploadUrl
}

export default audioController