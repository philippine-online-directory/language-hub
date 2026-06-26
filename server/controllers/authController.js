import prisma from '../prisma.js'
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken'
import validationErrorCheck from '../middleware/expressValidate.js';
import emailService from '../services/emailService.js';
import "dotenv/config";
import { body, matchedData } from 'express-validator'

const PASSWORD_RESET_TOKEN_BYTES = 32;
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const PASSWORD_RESET_SUCCESS_MESSAGE = 'If an account exists for that email, a password reset link has been sent.';

function signAuthToken(user) {
    return jwt.sign(
        { userId: user.id, tokenVersion: user.tokenVersion },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

function hashResetToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

const validateRegister = [
    body("email").exists()
        .notEmpty().withMessage('Email must not be empty')
        .trim()
        .isLength({ min: 4, max: 255 }).withMessage('Email must contain between 4 and 255 characters')
        .isEmail().withMessage('Email must be a valid address')
        .normalizeEmail()
        .custom(async email => {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user) throw new Error('Email already in use');
        }),
    body('password').exists()
        .notEmpty().withMessage('Password must not be empty')
        .trim()
        .isLength({ min: 8, max: 255 }).withMessage('Password must contain between 8 and 255 characters'),
    body('username').exists()
        .notEmpty()
        .trim()
        .isLength({ min: 4, max: 25 }).withMessage('Username must be between 4 and 25 characters')
]

const validateLogin = [
    body('email').exists()
        .isEmail().withMessage('Email must be a valid address')
        .normalizeEmail(),
    body('password').exists()
        .notEmpty().withMessage('Password must not be empty')
        .trim()
]

const validateForgotPassword = [
    body('email').exists()
        .isEmail().withMessage('Email must be a valid address')
        .normalizeEmail()
]

const validateResetPassword = [
    body('token').exists()
        .notEmpty().withMessage('Reset token is required')
        .trim(),
    body('password').exists()
        .notEmpty().withMessage('Password must not be empty')
        .trim()
        .isLength({ min: 8, max: 255 }).withMessage('Password must contain between 8 and 255 characters'),
]


const registerUser = [
    validateRegister,
    validationErrorCheck,
    async (req, res, next) => {
        const { email, password, username } = matchedData(req)

        try {
            const hashed = await bcrypt.hash(password, 10)

            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashed,
                    username
                }
            })

            const token = signAuthToken(user)

            res.status(201).json({ user, token })
        }
        catch (err) {
            next(err)
        }
    }
]

const loginUser = [
    validateLogin,
    validationErrorCheck,
    async (req, res, next) => {
        const { email, password } = matchedData(req)

        try {
            const user = await prisma.user.findUnique({
                where: {
                    email
                }
            })

            if (!user) return res.status(400).json({ error: "Incorrect username or password, or user does not exist" });

            const valid = await bcrypt.compare(password, user.password)
            if (!valid) return res.status(400).json({ error: "Incorrect username or password, or user does not exist" })

            const token = signAuthToken(user)

            res.status(200).json({ user, token })
        }
        catch (err) {
            next(err)
        }
    }

]

const forgotPassword = [
    validateForgotPassword,
    validationErrorCheck,
    async (req, res, next) => {
        const { email } = matchedData(req)

        try {
            const user = await prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true
                }
            })

            if (!user) {
                return res.status(200).json({ message: PASSWORD_RESET_SUCCESS_MESSAGE })
            }

            const resetToken = crypto.randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('hex')
            const tokenHash = hashResetToken(resetToken)
            const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS)
            const appUrl = process.env.APP_URL || 'http://localhost:5173'
            const resetUrl = `${appUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`

            await prisma.$transaction([
                prisma.passwordResetToken.updateMany({
                    where: {
                        userId: user.id,
                        usedAt: null
                    },
                    data: {
                        usedAt: new Date()
                    }
                }),
                prisma.passwordResetToken.create({
                    data: {
                        userId: user.id,
                        tokenHash,
                        expiresAt
                    }
                })
            ])

            await emailService.sendPasswordResetEmail(user.email, resetUrl)

            res.status(200).json({ message: PASSWORD_RESET_SUCCESS_MESSAGE })
        }
        catch (err) {
            next(err)
        }
    }
]

const resetPassword = [
    validateResetPassword,
    validationErrorCheck,
    async (req, res, next) => {
        const { token, password } = matchedData(req)

        try {
            const tokenHash = hashResetToken(token)
            const resetToken = await prisma.passwordResetToken.findUnique({
                where: { tokenHash }
            })

            if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
                return res.status(400).json({ message: 'Password reset link is invalid or expired.' })
            }

            const hashed = await bcrypt.hash(password, 10)
            const usedAt = new Date()

            await prisma.$transaction([
                prisma.user.update({
                    where: { id: resetToken.userId },
                    data: {
                        password: hashed,
                        tokenVersion: { increment: 1 }
                    }
                }),
                prisma.passwordResetToken.updateMany({
                    where: {
                        userId: resetToken.userId,
                        usedAt: null
                    },
                    data: {
                        usedAt
                    }
                })
            ])

            res.status(200).json({ message: 'Password has been reset. Please log in with your new password.' })
        }
        catch (err) {
            next(err)
        }
    }
]


const authController = {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword
}

export default authController
