const { Router } = require('express')
const languageRouter = Router();

const languageController = require('../controllers/languageController')

languageRouter.get('/', languageController.getAllLanguages)
languageRouter.get('/search', languageController.getLanguageByName)
languageRouter.get('/:isoCode', languageController.getLanguageByCode);
languageRouter.get('/:isoCode/translations', languageController.getPublishedTranslations);