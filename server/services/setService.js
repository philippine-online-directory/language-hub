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

async function createSet(name, description, userId){
    const createdSet = await prisma.vocabSet.create({
        data: {
            name,
            description,
            ownerId: userId
        }
    })

    return createdSet
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

async function publishSet(setId){
    const updatedSet = await prisma.vocabSet.update({
        where: {
            id: setId
        },
        data: {
            isPublic: true
        }
    })

    return updatedSet;
}

async function deleteSet(setId, userId){
    const deletedSet = await prisma.vocabSet.delete({
        where: {
            id: setId,
            ownerId: userId
        }
    }) 

    return deletedSet;
}

module.exports = {
    getUserSets,
    createSet,
    getSetWords,
    publishSet,
    deleteSet
}
