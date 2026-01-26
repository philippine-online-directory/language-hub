import prisma from '../prisma.js'

async function findTranslationInfo(id){
    const translation = await prisma.translation.findUnique({
        where: {
            id
        }
    })

    if (!translation) throw new Error('Translation does not exist');

    return translation
}

async function searchTranslationByWordText(code, word, mode, page = 1, limit = 20){
    const skip = (page - 1) * limit;
    
    let whereClause = {
        language: {
            isoCode: code
        },
        wordText: {
            contains: word,
            mode: 'insensitive'
        }
    };

    // Add status filter based on mode
    if (mode === "Verified Only" || (!mode || mode === "VERIFIED")) {
        whereClause.status = 'VERIFIED';
    } else if (mode !== "All" && mode !== "ALL") {
        whereClause.status = 'VERIFIED'; // Default to verified
    }
    // If mode is "All" or "ALL", don't add status filter

    const [translations, total] = await Promise.all([
        prisma.translation.findMany({
            where: whereClause,
            include: {
                language: true
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.translation.count({ where: whereClause })
    ]);
    
    return {
        translations,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

async function searchTranslationByWordDefinition(code, word, mode, page = 1, limit = 20){
    const skip = (page - 1) * limit;
    
    let whereClause = {
        language: {
            isoCode: code
        },
        englishDefinition: {
            contains: word,
            mode: 'insensitive'
        }
    };

    // Add status filter based on mode
    if (mode === "Verified Only" || (!mode || mode === "VERIFIED")) {
        whereClause.status = 'VERIFIED';
    } else if (mode !== "All" && mode !== "ALL") {
        whereClause.status = 'VERIFIED'; // Default to verified
    }
    // If mode is "All" or "ALL", don't add status filter

    const [translations, total] = await Promise.all([
        prisma.translation.findMany({
            where: whereClause,
            include: {
                language: true
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.translation.count({ where: whereClause })
    ]);

    return {
        translations,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

async function addTranslationToSet(vocabSetId, translationId, userId){
    const vocabSet = await prisma.vocabSet.findUnique({
        where: { id: vocabSetId }
    });

    if (!vocabSet) {
        throw new Error(`Vocab set ID ${vocabSetId} not found.`);
    }

    if (vocabSet.ownerId !== userId) {
        throw new Error("Permission denied: You can only add translations to sets you've created.");
    }
    
    const translation = await prisma.translation.findUnique({
        where: { 
            id: translationId 
        }
    });

    if (!translation) {
        throw new Error(`Translation ID ${translationId} not found`);
    }

    const existingEntry = await prisma.setWord.findUnique({
        where: {
            translationId_vocabSetId: {
                translationId,
                vocabSetId,
            }
        }
    });

    if (existingEntry) {
        throw new Error("This translation is already in the vocabulary set.");
    }

    const newSetWord = await prisma.setWord.create({
        data: {
            vocabSetId: vocabSetId,
            translationId: translationId
        },
        include: {
            translation: {
                select: {
                    wordText: true,
                    englishDefinition: true
                }
            }
        }
    });

    return newSetWord;
}

async function removeTranslationFromSet(vocabSetId, translationId, userId){
    const vocabSet = await prisma.vocabSet.findUnique({
        where: { id: vocabSetId }
    });

    if (!vocabSet) {
        throw new Error(`Vocab set ID ${vocabSetId} not found.`);
    }

    if (vocabSet.ownerId !== userId) {
        throw new Error("Permission denied: You can only remove translations to sets you've created.");
    }

    await prisma.setWord.delete({
        where: {
            translationId_vocabSetId: {
                translationId,
                vocabSetId
            }
        }
    });
}

async function updateTranslationStatus(id, status){
    if (status !== 'VERIFIED' && status !== 'UNVERIFIED') throw new Error('Status must be "VERIFIED" or "UNVERIFIED"')

    try {
        const updatedTranslation = await prisma.translation.update({
            where: { id },
            data: { status }
        })

        return updatedTranslation
    } 
    catch (err) {
        if (err.code === 'P2025') {
            throw new Error('Translation does not exist')
        }
        throw err
    }
}

const translationService = {
    findTranslationInfo,
    searchTranslationByWordText,
    searchTranslationByWordDefinition,
    addTranslationToSet,
    updateTranslationStatus,
    removeTranslationFromSet
}

export default translationService