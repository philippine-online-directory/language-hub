const auth = require('../middleware/auth')
const languageService = require('../services/languageService')

const getAllLanguages = [
    auth,
    async (req, res, next) => {
        try {
            const languages = await languageService.findLanguages()
            
            return res.status(200).json(languages)
        }
        catch (err) {
            console.error(err)
            next(err)
        }
    }
]

const getLanguageByCode = [
    auth,
    async (req, res, next) => {
        const { isoCode } = req.params
        
        try {
            const language = languageService.findLanguageByIsoCode(isoCode)

            return res.status(200).json(language)
        }
        catch (err) {
            console.error(err)
            next(err)
        }
    }
]

const getLanguageByName = [
    auth,
    async (req, res, next) => {
        const { name } = req.body

        try {
            const language = languageService.findLanguageByName(name)

            return res.status(200).json(language)
        }
        catch (err) {
            console.error(err)
            next(err)
        }
    }
]

const getPublishedTranslations = [
    auth,
    async (req, res, next) => {
        const { isoCode } = req.params

        try {
            const translations = languageService.getPublishedDictionary(isoCode)

            return res.status(200).json(translations)
        }
        catch (err) {
            console.error(err)
            next(err)
        }
    }
]

module.exports = {
    getAllLanguages,
    getLanguageByCode,
    getLanguageByName,
    getPublishedTranslations
}