import prisma from '../prisma.js'

async function addLanguage({ name, speakerCount, isoCode, preservationNote, culturalBackground }){
    const addedLanguage = await prisma.language.create({
        data: {
            name,
            speakerCount,
            isoCode,
            preservationNote,
            culturalBackground
        }
    })

    return addedLanguage
}

async function updateLanguage(id, { name, speakerCount, isoCode, preservationNote, culturalBackground }) {
    if (!id) throw new Error('Id missing: Must have id to identify which language to update');

    const updatedLanguage = await prisma.language.update({
        where: { 
            id 
        },
        data: { 
            name, 
            speakerCount, 
            isoCode,
            preservationNote, 
            culturalBackground 
        }
    });
    return updatedLanguage
}

async function deleteLanguage(id){
    if (!id) throw new Error('Id missing: Must have id to identify which language to delete ');

    try {
        await prisma.language.delete({
            where: {
                id
            }
        })
    }
    catch (err) {
        if (err.code === 'P2025') {
            throw new Error('Language does not exist')
        }
        throw err
    }
    
}

async function findLanguages(){
    const languages = await prisma.language.findMany();

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


const languageService = {
    findLanguages,
    findLanguageByIsoCode,
    getDictionary,
    findLanguageByName,
    addLanguage,
    updateLanguage,
    deleteLanguage
}

export default languageService


