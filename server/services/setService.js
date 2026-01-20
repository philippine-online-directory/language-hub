import prisma from '../prisma.js'

async function getUserSets(userId){
    if (!userId) throw new Error("Must be logged in to view sets");

    const sets = await prisma.vocabSet.findMany({
        where: {
            ownerId: userId
        },
        include: {
            language: true,
            _count: {
                select: {
                    setWords: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return sets;
}

async function getPublicSets(setName){
    const sets = await prisma.vocabSet.findMany({
        where: {
            isPublic: true,
            name: {
                contains: setName || '',
                mode: 'insensitive'
            }
        },
        include: {
            language: true,
            owner: {
                select: {
                    id: true,
                    username: true
                }
            },
            _count: {
                select: {
                    setWords: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 50
    })

    return sets;
}

async function getSetById(setId){
    const set = await prisma.vocabSet.findUnique({
        where: {
            id: setId
        },
        include: {
            language: true,
            owner: {
                select: {
                    id: true,
                    username: true
                }
            },
            _count: {
                select: {
                    setWords: true
                }
            }
        }
    })

    if (!set) throw new Error("Set does not exist");
    
    return set;
}

async function createSet(name, description, languageId, userId){
    if (!userId) throw new Error("Must be logged in to create a set");
    if (!name || !description || !languageId) throw new Error("Name, description, and language are required");

    // Check if user already has a set with this name
    const existingSet = await prisma.vocabSet.findFirst({
        where: {
            ownerId: userId,
            name: name
        }
    })

    if (existingSet) throw new Error("You already have a set with this name");

    const createdSet = await prisma.vocabSet.create({
        data: {
            name,
            description,
            languageId,
            ownerId: userId,
            isPublic: false
        },
        include: {
            language: true,
            _count: {
                select: {
                    setWords: true
                }
            }
        }
    })

    return createdSet;
}

async function updateSet(setId, data, userId){
    if (!userId) throw new Error("Must be logged in to update a set");

    const existingSet = await prisma.vocabSet.findUnique({
        where: {
            id: setId
        },
        select: {
            ownerId: true
        }
    })

    if (!existingSet) throw new Error("Set does not exist");
    if (existingSet.ownerId !== userId) throw new Error("You don't have permission to update this set");

    const updatedSet = await prisma.vocabSet.update({
        where: {
            id: setId
        },
        data: {
            name: data.name,
            description: data.description,
            isPublic: data.isPublic
        },
        include: {
            language: true,
            _count: {
                select: {
                    setWords: true
                }
            }
        }
    })

    return updatedSet;
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
        },
        include: {
            language: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return words;
}

async function deleteSet(setId, userId){
    if (!userId) throw new Error("Must be logged in to delete a set");

    const existingSet = await prisma.vocabSet.findUnique({
        where: {
            id: setId
        },
        select: {
            ownerId: true
        }
    })

    if (!existingSet) throw new Error("Set does not exist");
    if (existingSet.ownerId !== userId) throw new Error("You don't have permission to delete this set");

    const deletedSet = await prisma.vocabSet.delete({
        where: {
            id: setId
        }
    }) 

    return deletedSet;
}

const setService = {
    getUserSets,
    getPublicSets,
    getSetById,
    createSet,
    updateSet,
    getSetWords,
    deleteSet
}

export default setService