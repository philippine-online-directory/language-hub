const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

async function findLanguages(){
    const languages = await prisma.language.findAll();

    return languages
}

async function findLanguageByIsoCode(code){
    const language = await prisma.language.findUnique({
        where: {
            isoCode: code
        }
    })

    return language
}

async function findLanguageByName(phrase){
    const language = await prisma.language.findMany({
        where: {
            name: {
                startsWith: `${phrase}`,
                mode: 'insensitive'
            }
        }
    })

    return language
}

async function getPublishedDictionary(code){
    const language = await prisma.language.findUnique({
        where: { 
            isoCode: code 
        },
        include: {
            translations: {
                where: {
                    status: "PUBLISHED"
                }
            }
        }
    });

    return language?.translations
}



module.exports = {
    findLanguages,
    findLanguageByIsoCode,
    getPublishedDictionary,
    findLanguageByName
}
