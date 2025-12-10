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

async function searchTranslationByWordText(code, word){
    const translations = await prisma.translation.findMany({
        where: {
            language: {
                isoCode: code
            },
            wordText: {
                contains: word,
                mode: 'insensitive'
            },
            status: 'PUBLISHED'
        }
    })

    return translations
}

async function searchTranslationByWordDefinition(code, word){
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

module.exports = {
    findTranslationInfo,
    searchTranslationByWordText,
    searchTranslationByWordDefinition
}