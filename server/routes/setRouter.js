const { Router } = require('express');
const setRouter = Router();
const gameRouter = require('./gameRouter')

const setController = require('../controllers/setController');
const gameController = require('../controllers/gameController')
const { addTranslationToSet } = require('../controllers/translationController')

setRouter.get('/', setController.getUserSets);
setRouter.post('/', setController.createSet);
setRouter.get('/:setId', setController.getSetWords);
setRouter.put('/:setId', setController.publishSet);
setRouter.delete('/:setId', setController.deleteSet);

setRouter.post('/:setId/translations', addTranslationToSet);

setRouter.get('/:setId/games', gameController.viewGameSessions);
setRouter.post('/:setId/games', gameController.uploadGameSession)

setRouter.use('/:setId/games', gameRouter)


module.exports = setRouter;

