import jwt from 'jsonwebtoken'
import prisma from '../prisma.js'

async function auth(req, res, next){
    const header = req.headers.authorization;

    if (!header) return res.status(401).json({ error: 'No authorization header' });

    const token = header.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                createdAt: true,
            }
        });
        next();
    } 
    catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

export default auth