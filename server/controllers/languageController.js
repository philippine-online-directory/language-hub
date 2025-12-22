const auth = require('../middleware/auth')
const { isAdmin } = require('../middleware/roleAuth')
const languageService = require('../services/languageService')
const translationService = require('../services/translationService')
const { body, matchedData } = require('express-validator')
const validationErrorCheck = require('../middleware/expressValidate')

const validateLanguage = [
    body('name').notEmpty()
        .trim(),
    body('speakerCount').optional()
        .isInt()
        .trim(),
    body('isoCode').notEmpty()
        .trim(),
    body('preservationNote').trim()
]

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
            next(err)
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
            next(err)
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
            next(err)
        }
    }
];

const addLanguage = [
    auth,
    isAdmin,
    validateLanguage,
    validationErrorCheck,
    async (req, res, next) => {
        const { name,
            speakerCount,
            isoCode,
            preservationNote
        } = matchedData(req)

        try {
            const addedLanguage = languageService.addLanguage(name, speakerCount, isoCode, preservationNote)

            res.status(201).json(addedLanguage)
        }
        catch (err) {
            next(err)
        }
    }
]

const updateLanguage = [
    auth,
    isAdmin,
    validateLanguage,
    validationErrorCheck,
    async (req, res, next) => {
        const { name,
            speakerCount,
            isoCode,
            preservationNote
        } = matchedData(req)

        try {
            const updatedLanguage = languageService.updateLanguage(name, speakerCount, isoCode, preservationNote)

            res.status(200).json(updatedLanguage)
        }
        catch (err) {
            next(err)
        }
    }
]

const deleteLanguage = [
    auth,
    isAdmin,
    async (req, res, next) => {
        const { languageId } = req.params

        try {
            await languageService.deleteLanguage(languageId)

            res.sendStatus(204)
        }
        catch (err) {
            next(err)
        }
    }
]

module.exports = {
    getLanguages,
    getLanguageByCode,
    getPublishedTranslations,
    addLanguage,
    updateLanguage,
    deleteLanguage
}