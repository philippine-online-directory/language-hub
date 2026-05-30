import { Router } from 'express'
import languageController from '../controllers/languageController.js'
import translationController from '../controllers/translationController.js'
const languageRouter = Router();


languageRouter.get('/', languageController.getLanguages)
languageRouter.get('/common-words', languageController.getCommonWords)
languageRouter.get('/:slug/missing-words', languageController.getMissingCommonWords);
languageRouter.get('/:slug', languageController.getLanguageByCode);

// Admin protected language routes
languageRouter.post('/', languageController.addLanguage) 
languageRouter.put('/:languageId', languageController.updateLanguage)
languageRouter.delete('/:languageId', languageController.deleteLanguage)

// Translation nested routes
languageRouter.get('/:slug/translations', languageController.getTranslations);
languageRouter.get('/:slug/translations/:translationId', translationController.getTranslationInfo);
languageRouter.patch('/:slug/translations/:translationId', translationController.updateTranslationStatus); // admin protected
languageRouter.delete('/:slug/translations/:translationId', translationController.deleteTranslation);     // admin protected

export default languageRouter
