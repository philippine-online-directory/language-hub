const { Router } = require('express')
const contributionRouter = Router();

const contributionController = require('../controllers/contributionController')

contributionRouter.get('/', contributionController.getUserContributions)
contributionRouter.post('/', contributionController.contributeTranslation)

module.exports = contributionRouter