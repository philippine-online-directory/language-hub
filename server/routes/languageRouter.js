const { Router } = require('express')
const languageRouter = Router();

const languageController = require('../controllers/languageController')
const translationController = require('../controllers/translationController');

languageRouter.get('/', languageController.getAllLanguages)
languageRouter.get('/search', languageController.getLanguageByName)
languageRouter.get('/:isoCode', languageController.getLanguageByCode);
languageRouter.get('/:isoCode/translations', languageController.getPublishedTranslations);

//Translation nested routes
languageRouter.get('/:isoCode/translations/search', translationController.searchTranslations);
languageRouter.get('/:isoCode/translations/:translationId', translationController.getTranslationInfo);

module.exports = languageRouter