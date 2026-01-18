import prisma from '../prisma.js'

async function viewGameSessions(userId, setId, gameType){
    if (!userId) throw new Error("Must be logged in to view game sessions");
    
    const gameSessions = await prisma.gameSession.findMany({
        where: {
            userId,
            gameType,
            vocabSetId: setId
        }
    })

    return gameSessions
}

async function uploadGameSession(userId, setId, gameType, score, duration){
    const createdSession = await prisma.gameSession.create({
        data: {
            gameType,
            userId,
            vocabSetId: setId,
            score,
            duration
        }
    })

    return createdSession
}

const gameService = {
    viewGameSessions,
    uploadGameSession
}

export default gameService
