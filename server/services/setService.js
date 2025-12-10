const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

async function getUserSets(userId){
    const user = await prisma.user.findMany({
        where: {
            id: userId
        },
        include: {
            createdSets: true
        }
    })

    return user.createdSets;
}

async function getSetWords(setId){
    const words = await prisma.translation.findMany({
        where: {
            setWords: {
                some: {
                    vocabSetId: setId
                }
            }
        }
    });

    return words;
}