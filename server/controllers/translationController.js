const auth = require('../middleware/auth')
const translationService = require('../services/translationService')

const getTranslationInfo = [
    auth,
    async (req, res, next) => {
        const { translationId } = req.params

        try {
            const translation = await translationService.findTranslationInfo(translationId)

            if (!translation) {
                return res.status(404).json({ message: "Translation not found" })
            }

            res.status(200).json(translation)
        }
        catch (err) {
            console.error(err)
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

        if (!translationId) {
            return res.status(400).json({
                message: "translationId is required"
            });
        }

        try {
            const setWord = await translationService.addTranslationToSet(
                vocabSetId,
                translationId,
                userId
            );

            res.status(201).json(setWord);
        } 
        catch (err) {
            console.error(err); 
        }
    }
]

module.exports = {
    getTranslationInfo,
    addTranslationToSet
}

