const { Router } = require('express')
const gameRouter = Router()

const gameController = require('../controllers/gameController')

gameRouter.get('/', gameController.viewGameSessions);
gameRouter.post('/', gameController.uploadGameSession)

module.exports = gameRouter