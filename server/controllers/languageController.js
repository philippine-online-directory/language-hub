import auth from '../middleware/auth.js'
import { isAdmin } from '../middleware/roleAuth.js'
import languageService from '../services/languageService.js'
import translationService from '../services/translationService.js'
import { body, matchedData } from 'express-validator'
import validationErrorCheck from '../middleware/expressValidate.js'

const validateLanguage = [
    body('name').notEmpty()
        .trim(),
    body('speakerCount').optional()
        .optional({ nullable: true, checkFalsy: true })
        .isInt().withMessage('Speaker count must be an integer')
        .toInt(),
    body('isoCode').notEmpty()
        .trim(),
    body('preservationNote').trim(),
    body('culturalBackground').trim()
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

const getTranslations = [
  auth,
  async (req, res, next) => {
    const { isoCode } = req.params;
    const { text, definition, status } = req.query;

    try {
      let translations;

      if (text) {
        translations = await translationService.searchTranslationByWordText(
          isoCode,
          text,
          status
        );
      } else if (definition) {
        translations = await translationService.searchTranslationByWordDefinition(
          isoCode,
          definition,
          status
        );
      } else {
        translations = await languageService.getDictionary(isoCode, status);
      }

      res.status(200).json(translations);
    } catch (err) {
      next(err);
    }
  }
];

//admin functions
const addLanguage = [
    auth,
    isAdmin,
    validateLanguage,
    validationErrorCheck,
    async (req, res, next) => {
        const languageData = matchedData(req);

        try {
            const addedLanguage = await languageService.addLanguage(languageData); 
            res.status(201).json(addedLanguage);
        }
        catch (err) {
            next(err);
        }
    }
]

const updateLanguage = [
    auth,
    isAdmin,
    validateLanguage,
    validationErrorCheck,
    async (req, res, next) => {
        const { languageId } = req.params;
        const languageData = matchedData(req);

        try {
            const updatedLanguage = await languageService.updateLanguage(languageId, languageData);
            res.status(200).json(updatedLanguage);
        } catch (err) {
            next(err);
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

const languageController = {
    getLanguages,
    getLanguageByCode,
    getTranslations,
    addLanguage,
    updateLanguage,
    deleteLanguage
}

export default languageController