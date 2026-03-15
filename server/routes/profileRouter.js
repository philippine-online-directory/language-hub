import { Router } from 'express'
import profileController from '../controllers/profileController.js'

const profileRouter = Router();

profileRouter.get('/me', profileController.getMyProfile)
profileRouter.patch('/me', profileController.setMyProfile)
profileRouter.get('/:userId', profileController.getPublicProfile)
profileRouter.get('/', profileController.searchUsers)

export default profileRouter

