const { Router } = require('express')
const languageRouter = Router();

const languageController = require('../controllers/languageController')
const translationController = require('../controllers/translationController');

languageRouter.get('/', languageController.getLanguages) //handles sesarch by name
languageRouter.get('/:isoCode', languageController.getLanguageByCode);

//admin protected routes
languageRouter.post('/', languageController.addLanguage) 
languageRouter.put('/:languageId', languageController.updateLanguage)
languageRouter.delete('/:languageId', languageController.deleteLanguage)

//Translation nested routes
languageRouter.get('/:isoCode/translations', languageController.getPublishedTranslations);
languageRouter.get('/:isoCode/translations/:translationId', translationController.getTranslationInfo);
languageRouter.patch('/:isoCode/translations/:translationId', translationController.updateTranslationStatus); //admin protected

module.exports = languageRouter