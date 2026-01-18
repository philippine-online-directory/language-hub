import auth from '../middleware/auth.js'
import gameService from '../services/gameService.js'

const viewGameSessions = [
    auth,
    async (req, res, next) => {
        const { id } = req.user
        const { setId } = req.params
        const { game } = req.query

        try {
            const sessions = await gameService.viewGameSessions(id, setId, game)

            res.status(200).json(sessions);
        }
        catch (err) {
            next(err)
        }
    }
]

const uploadGameSession = [
    auth,
    async (req, res, next) => {
        const { id } = req.user
        const { setId } = req.params
        const { game } = req.query
        
        const { score, duration } = req.body

        try {
            const createdSession = await gameService.uploadGameSession(id, setId, game, score, duration)

            res.status(201).json(createdSession)
        }
        catch (err) {
            next(err)
        }
    }
]

const gameController = {
    viewGameSessions,
    uploadGameSession
}

export default gameController

