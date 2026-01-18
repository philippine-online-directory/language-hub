import { Router } from 'express'
import profileController from '../controllers/profileController.js'

const profileRouter = Router();

profileRouter.get('/me', profileController.getMyProfile)
profileRouter.get('/:userId', profileController.getPublicProfile)
profileRouter.get('/', profileController.searchUsers)

export default profileRouter

