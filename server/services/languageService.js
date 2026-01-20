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


async function getDictionary(isoCode, status) {
  let normalizedStatus = 'VERIFIED';

  if (status === 'ALL') {
    normalizedStatus = 'ALL';
  } else if (status === 'UNVERIFIED') {
    normalizedStatus = 'UNVERIFIED';
  } else if (status === 'VERIFIED') {
    normalizedStatus = 'VERIFIED';
  }

  let translationsInclude;

  if (normalizedStatus === 'ALL') {
    translationsInclude = true;
  } else {
    translationsInclude = {
      where: {
        status: normalizedStatus
      }
    };
  }

  const language = await prisma.language.findUnique({
    where: { isoCode },
    include: {
      translations: translationsInclude
    }
  });

  return language ? language.translations : [];
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


