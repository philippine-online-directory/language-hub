const prisma = require('../prisma')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validationErrorCheck = require('../middleware/expressValidate')
require('dotenv').config();
const { body, matchedData } = require("express-validator");


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

            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

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

            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

            res.status(200).json({ user, token })
        }
        catch (err) {
            next(err)
        }
    }

]


module.exports = {
    registerUser,
    loginUser
}