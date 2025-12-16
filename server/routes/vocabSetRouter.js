const { Router } = require('express')
const vocabSetRouter = Router();

const { addTranslationToSet } = require('../controllers/translationController')

vocabSetRouter.post('/:vocabSetId/translations', addTranslationToSet);

module.exports = vocabSetRouter

