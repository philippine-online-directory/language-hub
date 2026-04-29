import { Router } from 'express'
import languageController from '../controllers/languageController.js'
import translationController from '../controllers/translationController.js'
const languageRouter = Router();


languageRouter.get('/', languageController.getLanguages)
languageRouter.get('/common-words', languageController.getCommonWords)
languageRouter.get('/:isoCode/missing-words', languageController.getMissingCommonWords);
languageRouter.get('/:isoCode', languageController.getLanguageByCode);

// Admin protected language routes
languageRouter.post('/', languageController.addLanguage) 
languageRouter.put('/:languageId', languageController.updateLanguage)
languageRouter.delete('/:languageId', languageController.deleteLanguage)

// Translation nested routes
languageRouter.get('/:isoCode/translations', languageController.getTranslations);
languageRouter.get('/:isoCode/translations/:translationId', translationController.getTranslationInfo);
languageRouter.patch('/:isoCode/translations/:translationId', translationController.updateTranslationStatus); // admin protected
languageRouter.delete('/:isoCode/translations/:translationId', translationController.deleteTranslation);     // admin protected

export default languageRouter
