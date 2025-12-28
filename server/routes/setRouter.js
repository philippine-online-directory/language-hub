const { Router } = require('express');
const setRouter = Router();
const gameRouter = require('./gameRouter')

const setController = require('../controllers/setController');
const { addTranslationToSet, removeTranslationFromSet } = require('../controllers/translationController')

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


module.exports = setRouter;

