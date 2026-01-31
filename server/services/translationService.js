import prisma from '../prisma.js'
import s3Service from './s3Service.js'

async function findTranslationInfo(id){
    const translation = await prisma.translation.findUnique({
        where: {
            id
        },
        include: {
            author: {
                select: {
                    id: true,
                    username: true
                }
            }
        }
    })

    if (!translation) throw new Error('Translation does not exist');

    if (translation.audioUrl) {
        translation.audioUrl = await s3Service.generateDownloadUrl(translation.audioUrl);
    }

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

    if (mode === "Verified Only" || (!mode || mode === "VERIFIED")) {
        whereClause.status = 'VERIFIED';
    } else if (mode !== "All" && mode !== "ALL") {
        whereClause.status = 'VERIFIED'; 
    }

    const [translations, total] = await Promise.all([
        prisma.translation.findMany({
            where: whereClause,
            include: {
                language: true,
                author: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.translation.count({ where: whereClause })
    ]);
    
    const translationsWithSignedUrls = await Promise.all(
        translations.map(async (translation) => {
            if (translation.audioUrl) {
                const signedUrl = await s3Service.generateDownloadUrl(translation.audioUrl);
                return {
                    ...translation,
                    audioUrl: signedUrl,
                };
            }
            return translation;
        })
    );

    return {
        translations: translationsWithSignedUrls,
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

    if (mode === "Verified Only" || (!mode || mode === "VERIFIED")) {
        whereClause.status = 'VERIFIED';
    } else if (mode !== "All" && mode !== "ALL") {
        whereClause.status = 'VERIFIED'; 
    }

    const [translations, total] = await Promise.all([
        prisma.translation.findMany({
            where: whereClause,
            include: {
                language: true,
                author: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.translation.count({ where: whereClause })
    ]);

    const translationsWithSignedUrls = await Promise.all(
        translations.map(async (translation) => {
            if (translation.audioUrl) {
                const signedUrl = await s3Service.generateDownloadUrl(translation.audioUrl);
                return {
                    ...translation,
                    audioUrl: signedUrl,
                };
            }
            return translation;
        })
    );

    return {
        translations: translationsWithSignedUrls,
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