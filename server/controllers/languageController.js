const auth = require('../middleware/auth')
const languageService = require('../services/languageService')
const translationService = require('../services/translationService')
const handleError = require('../middleware/errorHandler')

const getLanguages = [
    auth,
    async (req, res, next) => {
        const { name } = req.query;

        try {
            const languages = name
            ? await languageService.findLanguageByName(name)
            : await languageService.findLanguages();

            res.status(200).json(languages);
        } 
        catch (err) {
            handleError(err, req, res, next)
        }
    }
];


const getLanguageByCode = [
    auth,
    async (req, res, next) => {
        const { isoCode } = req.params
        
        try {
            const language = await languageService.findLanguageByIsoCode(isoCode)

            return res.status(200).json(language)
        }
        catch (err) {
            handleError(err, req, res, next)
        }
    }
]

const getPublishedTranslations = [
    auth,
    async (req, res, next) => {
        const { isoCode } = req.params;
        const { text, definition, mode } = req.query;

        try {
            let translations;

            if (text) {
                translations = await translationService.searchTranslationByWordText(
                    isoCode,
                    text,
                    mode
                );
            } 
            else if (definition) {
                translations = await translationService.searchTranslationByWordDefinition(
                    isoCode,
                    definition,
                    mode
                );
            } 
            else {
                translations = await languageService.getDictionary(isoCode, mode);
            }

            res.status(200).json(translations);
        }
        catch (err) {
            handleError(err, req, res, next)
        }
    }
];

module.exports = {
    getLanguages,
    getLanguageByCode,
    getPublishedTranslations
}