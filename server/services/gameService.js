const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function viewGameSessions(userId, setId, gameType){
    const gameSessions = await prisma.gameSession.findMany({
        where: {
            userId,
            gameType,
            vocabSetId: setId
        }
    })

    return gameSessions
}