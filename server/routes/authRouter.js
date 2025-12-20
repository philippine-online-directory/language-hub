const { Router } = require('express')
const authRouter = Router();

const authController = require('../controllers/authController')

authRouter.post('/register', authController.registerUser)
authRouter.post('/login', authController.loginUser)

module.exports = authRouter