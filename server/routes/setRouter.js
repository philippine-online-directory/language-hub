const { Router } = require('express');
const setRouter = Router();

const setController = require('../controllers/setController');
const { addTranslationToSet } = require('../controllers/translationController')

setRouter.get('/', setController.getUserSets);
setRouter.post('/', setController.createSet);
setRouter.get('/:setId', setController.getSetWords);
setRouter.put('/:setId', setController.publishSet);
setRouter.delete('/:setId', setController.deleteSet);
setRouter.post('/:setId/translations', addTranslationToSet);


module.exports = setRouter;

