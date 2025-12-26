const auth = require('../middleware/auth')
const { isAdmin } = require('../middleware/roleAuth')
const translationService = require('../services/translationService')

const getTranslationInfo = [
    auth,
    async (req, res, next) => {
        const { translationId } = req.params

        try {
            const translation = await translationService.findTranslationInfo(translationId)

            res.status(200).json(translation)
        }
        catch (err) {
            next(err)
        }
    }
]

const addTranslationToSet = [
    auth,
    async (req, res, next) => {
        const { vocabSetId } = req.params;
        const { translationId } = req.body;
        const userId = req.user.id;

        try {
            const setWord = await translationService.addTranslationToSet(
                vocabSetId,
                translationId,
                userId
            );

            res.status(201).json(setWord);
        } 
        catch (err) {
            next(err)
        }
    }
]

const removeTranslationFromSet = [
    auth,
    async (req, res, next) => {
        const { vocabSetId } = req.params;
        const { translationId } = req.body;
        const { id } = req.user

        try {
            await translationService.removeTranslationFromSet(vocabSetId, translationId, id);

            res.sendStatus(204);
        }
        catch (err) {
            next(err)
        }
    }
]

//admin function
const updateTranslationStatus = [
    auth,
    isAdmin,
    async (req, res, next) => {
        const { translationId } = req.params
        const { status } = req.body

        try {
            const updatedTranslation = await translationService.updateTranslationStatus(translationId, status)

            res.status(200).json(updatedTranslation)
        }
        catch (err) {
            next(err)
        }
    }
]

module.exports = {
    getTranslationInfo,
    addTranslationToSet,
    updateTranslationStatus,
    removeTranslationFromSet
}

