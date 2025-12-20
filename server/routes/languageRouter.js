const { Router } = require('express')
const languageRouter = Router();

const languageController = require('../controllers/languageController')
const translationController = require('../controllers/translationController');

languageRouter.get('/', languageController.getLanguages)
languageRouter.get('/:isoCode', languageController.getLanguageByCode);

//Translation nested routes
languageRouter.get('/:isoCode/translations', languageController.getPublishedTranslations);
languageRouter.get('/:isoCode/translations/:translationId', translationController.getTranslationInfo);

module.exports = languageRouter