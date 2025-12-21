const auth = require('../middleware/auth')
const contributeService = require('../services/contributeService')
const handleError = require('../middleware/errorHandler')

const contributeTranslation = [
    auth,
    async (req, res, next) => {
        const { id } = req.user
        const { wordText, 
            ipa,
            englishDefinition,
            exampleSentence,
            languageName
        } = req.body;

        try {
            const contributedTranslation = await contributeService.contributeTranslation(id, 
                wordText,
                ipa,
                englishDefinition,
                exampleSentence,
                languageName
            )

            res.status(201).json(contributedTranslation)
        }
        catch (err) {
            handleError(err, req, res, next)
        }
    }
]

const getUserContributions = [
    auth,
    async (req, res, next) => {
        const { id } = req.user

        try {
            const contributions = await contributeService.getUserContributions(id);

            res.status(200).json(contributions)
        }
        catch (err) {
            handleError(err, req, res, next)
        }
    }
]

module.exports = {
    contributeTranslation,
    getUserContributions
}