const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

async function addLanguage(name, speakerCount, isoCode, preservationNote){
    const addedLanguage = await prisma.language.create({
        data: {
            name,
            speakerCount,
            isoCode,
            preservationNote
        }
    })

    return addedLanguage
}

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

async function getDictionary(code, mode){
    let language;
    if (mode === "Verified Only"){
        language = await prisma.language.findUnique({
            where: { 
                isoCode: code 
            },
            include: {
                translations: {
                    where: {
                        status: "VERIFIED"
                    }
                }
            }
        });
    }
    else if (mode === "All"){
        language = await prisma.language.findUnique({
            where: { 
                isoCode: code 
            },
            include: {
                translations
            }
        });
    }
    else {
        language = await prisma.language.findUnique({
            where: { 
                isoCode: code 
            },
            include: {
                translations: {
                    where: {
                        status: "VERIFIED"
                    }
                }
            }
        });
    }
    

    return language?.translations
}



module.exports = {
    findLanguages,
    findLanguageByIsoCode,
    getDictionary,
    findLanguageByName
}
