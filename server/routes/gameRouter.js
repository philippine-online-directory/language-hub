import { Router } from 'express'
import gameController from '../controllers/gameController.js'

const gameRouter = Router()

gameRouter.get('/', gameController.viewGameSessions);
gameRouter.post('/', gameController.uploadGameSession)

export default gameRouter