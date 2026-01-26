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

async function findLanguages(page = 1, limit = 20){
    const skip = (page - 1) * limit;
    
    const [languages, total] = await Promise.all([
        prisma.language.findMany({
            skip,
            take: limit,
            orderBy: {
                name: 'asc'
            }
        }),
        prisma.language.count()
    ]);

    return {
        languages,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

async function findLanguageByIsoCode(code){
    const language = await prisma.language.findUnique({
        where: {
            isoCode: code
        }
    })

    return language
}

async function findLanguageByName(phrase, page = 1, limit = 20){
    const skip = (page - 1) * limit;
    
    const where = {
        name: {
            startsWith: `${phrase}`,
            mode: 'insensitive'
        }
    };

    const [languages, total] = await Promise.all([
        prisma.language.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                name: 'asc'
            }
        }),
        prisma.language.count({ where })
    ]);

    return {
        languages,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}


async function getDictionary(isoCode, status, page = 1, limit = 20, textSearch, definitionSearch) {
  const skip = (page - 1) * limit;
  
  let normalizedStatus = 'VERIFIED';

  if (status === 'ALL') {
    normalizedStatus = 'ALL';
  } else if (status === 'UNVERIFIED') {
    normalizedStatus = 'UNVERIFIED';
  } else if (status === 'VERIFIED') {
    normalizedStatus = 'VERIFIED';
  }

  let whereClause = {
    language: {
      isoCode
    }
  };

  if (normalizedStatus !== 'ALL') {
    whereClause.status = normalizedStatus;
  }

  if (textSearch) {
    whereClause.wordText = {
      contains: textSearch,
      mode: 'insensitive'
    };
  }

  if (definitionSearch) {
    whereClause.englishDefinition = {
      contains: definitionSearch,
      mode: 'insensitive'
    };
  }

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