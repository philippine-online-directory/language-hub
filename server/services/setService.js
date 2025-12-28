const prisma = require('../prisma')

async function getUserSets(userId){
    if (!userId) throw new Error("Must be logged in to view sets");

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

async function getPublicSets(setName){
    const sets = await prisma.vocabSet.findMany({
        where: {
            name: {
                startsWith: setName,
                mode: 'insensitive'
            }
        }
    })
}

async function createSet(name, description, userId){
    if (!userId) throw new Error("Must be logged in to create a set");

    const existingSet = await prisma.vocabSet.findUnique({
        where: {
            ownerId: userId,
            name
        },
        select: {
            id: true
        }
    })

    if (existingSet) throw new Error("User has created a set with this name already")

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
    const existingSet = await prisma.vocabSet.findUnique({
        where: {
            id: setId
        },
        select: {
            id: true
        }
    })

    if (!existingSet) throw new Error("Set does not exist");
    
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
    const existingSet = await prisma.vocabSet.findUnique({
        where: {
            id: setId
        },
        select: {
            id: true
        }
    })

    if (!existingSet) throw new Error("Set does not exist");

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
    if (!userId) throw new Error("Must be logged in to delete a set");

    const existingSet = await prisma.vocabSet.findUnique({
        where: {
            id: setId
        },
        select: {
            id: true
        }
    })

    if (!existingSet) throw new Error("Set does not exist");

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
    deleteSet,
    getPublicSets
}
