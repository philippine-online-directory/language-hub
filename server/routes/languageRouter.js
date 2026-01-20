import { Router } from 'express'
import languageController from '../controllers/languageController.js'
import translationController from '../controllers/translationController.js'
const languageRouter = Router();


languageRouter.get('/', languageController.getLanguages) //handles sesarch by name
languageRouter.get('/:isoCode', languageController.getLanguageByCode);

//admin protected routes
languageRouter.post('/', languageController.addLanguage) 
languageRouter.put('/:languageId', languageController.updateLanguage)
languageRouter.delete('/:languageId', languageController.deleteLanguage)

//Translation nested routes
languageRouter.get('/:isoCode/translations', languageController.getTranslations);
languageRouter.get('/:isoCode/translations/:translationId', translationController.getTranslationInfo);
languageRouter.patch('/:isoCode/translations/:translationId', translationController.updateTranslationStatus); //admin protected

export default languageRouter