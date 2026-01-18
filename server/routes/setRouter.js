import { Router } from 'express'
import gameRouter from './gameRouter.js' 
import setController from '../controllers/setController.js'
import translationController from '../controllers/translationController.js'

const { addTranslationToSet, removeTranslationFromSet } = translationController

const setRouter = Router()

setRouter.get('/public', setController.getPublicSets);

setRouter.get('/', setController.getUserSets);
setRouter.get('/public', setController.getPublicSets);
setRouter.post('/', setController.createSet);
setRouter.get('/:setId', setController.getSetWords);
setRouter.put('/:setId', setController.publishSet);
setRouter.delete('/:setId', setController.deleteSet);

setRouter.post('/:setId/translations', addTranslationToSet);
setRouter.delete('/:setId/translations/:translationId', removeTranslationFromSet)

setRouter.use('/:setId/games', gameRouter)


export default setRouter;

