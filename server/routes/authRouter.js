import { Router } from 'express'
import rateLimit from "express-rate-limit";
import authController from '../controllers/authController.js'

const authRouter = Router();

const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false
});

authRouter.post('/register', authController.registerUser)
authRouter.post('/login', authController.loginUser)
authRouter.post('/forgot-password', passwordResetLimiter, authController.forgotPassword)
authRouter.post('/reset-password', passwordResetLimiter, authController.resetPassword)

export default authRouter
