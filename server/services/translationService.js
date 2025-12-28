const prisma = require('../prisma')

async function findTranslationInfo(id){
    const translation = await prisma.translation.findUnique({
        where: {
            id
        }
    })

    if (!translation) throw new Error('Translation does not exist');

    return translation
}

async function searchTranslationByWordText(code, word, mode){
    let translations

    if (mode === "Verified Only"){
        translations = await prisma.translation.findMany({
            where: {
                language: {
                    isoCode: code
                },
                wordText: {
                    contains: word,
                    mode: 'insensitive'
                },
                status: 'VERIFIED'
            }
        })
    }
    else if (mode === "All"){
        translations = await prisma.translation.findMany({
            where: {
                language: {
                    isoCode: code
                },
                wordText: {
                    contains: word,
                    mode: 'insensitive'
                }
            }
        })
    }
    else {
        translations = await prisma.translation.findMany({
            where: {
                language: {
                    isoCode: code
                },
                wordText: {
                    contains: word,
                    mode: 'insensitive'
                },
                status: 'VERIFIED'
            }
        })
    }
    
    return translations
}

async function searchTranslationByWordDefinition(code, word, mode){
    let translations;

    if (mode === "Verified Only"){
        translations = await prisma.translation.findMany({
            where: {
                language: {
                    isoCode: code
                },
                englishDefinition: {
                    contains: word,
                    mode: 'insensitive'
                },
                status: 'VERIFIED'
            }
        })
    }
    else if (mode === "All"){
        translations = await prisma.translation.findMany({
            where: {
                language: {
                    isoCode: code
                },
                englishDefinition: {
                    contains: word,
                    mode: 'insensitive'
                }
            }
        })
    }
    else {
        translations = await prisma.translation.findMany({
            where: {
                language: {
                    isoCode: code
                },
                englishDefinition: {
                    contains: word,
                    mode: 'insensitive'
                },
                status: 'VERIFIED'
            }
        })
    }

    return translations
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
            vocabSetId,
            translationId
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

module.exports = {
    findTranslationInfo,
    searchTranslationByWordText,
    searchTranslationByWordDefinition,
    addTranslationToSet,
    updateTranslationStatus,
    removeTranslationFromSet
}