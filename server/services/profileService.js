const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

async function getProfile(userId) {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            username: true,
            createdAt: true,
            role: true,
            _count: {
                select: {
                    contributions: true,
                    createdSets: true,
                    gameScores: true
                }
            }
        }
    });
    
    return user;
}

module.exports = getProfile

