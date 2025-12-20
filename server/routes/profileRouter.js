const { Router } = require('express')
const profileRouter = Router();

const profileController = require('../controllers/profileController')

profileRouter.get('/me', profileController.getMyProfile)
profileRouter.get('/:userId', profileController.getPublicProfile)

module.exports = profileRouter

