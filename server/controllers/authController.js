const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function registerUser(req, res, next){
    const { email, password, username } = req.body

    try {
        const existing = await prisma.user.findUnique({
            where: {
                email
            }
        })

        if (existing) return res.status(400).json({ error: "Email already in use" });

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
        console.error(err)
        next(err);
    }
}

async function loginUser(req, res, next){
    const { email, password } = req.body

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
        console.error(err)
        next(err)
    }
}

module.exports = {
    registerUser,
    loginUser
}