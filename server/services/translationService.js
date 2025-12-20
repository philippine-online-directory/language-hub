const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

async function findTranslationInfo(id){
    const translation = await prisma.translation.findUnique({
        where: {
            id
        }
    })

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
    const translations = await prisma.translation.findMany({
        where: {
            language: {
                isoCode: code
            },
            englishDefinition: {
                contains: word,
                mode: 'insensitive'
            },
            status: 'PUBLISHED'
        }
    })

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
        throw new Error("Permission denied: You can only add translations to sets you own.");
    }
    
    const translation = await prisma.translation.findUnique({
        where: { id: translationId, status: 'PUBLISHED' }
    });

    if (!translation) {
        throw new Error(`Translation ID ${translationId} not found or is not published.`);
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

module.exports = {
    findTranslationInfo,
    searchTranslationByWordText,
    searchTranslationByWordDefinition,
    addTranslationToSet
}