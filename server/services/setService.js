import prisma from '../prisma.js'
import languageService from './languageService.js'

const LANGUAGE_SUMMARY_SELECT = {
    id: true,
    name: true,
    isoCode: true,
    slug: true
};

async function getUserSets(userId, page = 1, limit = 12){
    if (!userId) throw new Error("Must be logged in to view sets");

    const skip = (page - 1) * limit;
    
    const where = {
        ownerId: userId
    };

    const [sets, total] = await Promise.all([
        prisma.vocabSet.findMany({
            where,
            include: {
                language: { select: LANGUAGE_SUMMARY_SELECT },
                _count: {
                    select: {
                        setWords: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.vocabSet.count({ where })
    ]);

    return {
        sets,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

async function getPublicSets(setName, page = 1, limit = 12){
    const skip = (page - 1) * limit;
    
    const where = {
        isPublic: true,
        name: {
            contains: setName || '',
            mode: 'insensitive'
        }
    };

    const [sets, total] = await Promise.all([
        prisma.vocabSet.findMany({
            where,
            include: {
                language: { select: LANGUAGE_SUMMARY_SELECT },
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
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.vocabSet.count({ where })
    ]);

    return {
        sets,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

async function getSetById(setId){
    const set = await prisma.vocabSet.findUnique({
        where: {
            id: setId
        },
        include: {
            language: { select: LANGUAGE_SUMMARY_SELECT },
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
            language: { select: LANGUAGE_SUMMARY_SELECT },
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
            language: { select: LANGUAGE_SUMMARY_SELECT },
            _count: {
                select: {
                    setWords: true
                }
            }
        }
    })

    return updatedSet;
}

async function getSetWords(setId, page, limit){
    const existingSet = await prisma.vocabSet.findUnique({
        where: {
            id: setId
        },
        select: {
            id: true
        }
    })

    if (!existingSet) throw new Error("Set does not exist");

    const where = {
        setWords: {
            some: {
                vocabSetId: setId
            }
        }
    };
    const orderBy = {
        createdAt: 'desc'
    };
    const shouldPaginate = Number.isInteger(page) && Number.isInteger(limit);

    const [words, total] = shouldPaginate
        ? await Promise.all([
            prisma.translation.findMany({
                where,
                include: {
                    language: { select: LANGUAGE_SUMMARY_SELECT },
                    author: {
                        select: { id: true, username: true }
                    }
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy
            }),
            prisma.translation.count({ where })
        ])
        : [await prisma.translation.findMany({
            where,
            include: {
                language: { select: LANGUAGE_SUMMARY_SELECT },
                author: {
                    select: { id: true, username: true }
                }
            },
            orderBy
        }), null];

    // Convert S3 keys to signed download URLs
    const wordsWithSignedUrls = await languageService.attachSignedUrls(words);

    if (shouldPaginate) {
        return {
            translations: wordsWithSignedUrls,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    return wordsWithSignedUrls;
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

async function getSetsContainingTranslation(translationId, userId){
    if (!userId) throw new Error("Must be logged in");
    if (!translationId) throw new Error("Translation ID is required");

    // Find all user's sets that contain this translation
    const sets = await prisma.vocabSet.findMany({
        where: {
            ownerId: userId,
            setWords: {
                some: {
                    translationId: translationId
                }
            }
        },
        include: {
            language: { select: LANGUAGE_SUMMARY_SELECT },
            _count: {
                select: {
                    setWords: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return sets;
}

const setService = {
    getUserSets,
    getPublicSets,
    getSetById,
    createSet,
    updateSet,
    getSetWords,
    deleteSet,
    getSetsContainingTranslation
}

export default setService
