import prisma from '../prisma.js'
import storageService from './storageService.js'

/**
 * Helper to convert storage keys into signed URLs for a list of translations
 */
async function attachSignedUrls(translations) {
    return await Promise.all(
        translations.map(async (translation) => {
        if (translation.audioUrl) {
            const signedUrl = await storageService.generateDownloadUrl(translation.audioUrl);
            return {
            ...translation,
            audioUrl: signedUrl,
            };
        }
        return translation;
        })
    );
}

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
    if (status === 'ALL') normalizedStatus = 'ALL';
    else if (status === 'UNVERIFIED') normalizedStatus = 'UNVERIFIED';

    let whereClause = {
        language: { isoCode }
    };

    if (normalizedStatus !== 'ALL') {
        whereClause.status = normalizedStatus;
    }

    if (textSearch) {
        whereClause.wordText = { contains: textSearch, mode: 'insensitive' };
    }

    if (definitionSearch) {
        whereClause.englishDefinition = { contains: definitionSearch, mode: 'insensitive' };
    }

    const [translations, total] = await Promise.all([
        prisma.translation.findMany({
        where: whereClause,
        include: {
            language: true,
            author: {
            select: { id: true, username: true }
            }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
        }),
        prisma.translation.count({ where: whereClause })
    ]);

    // Use the helper to sign URLs
    const translationsWithSignedUrls = await attachSignedUrls(translations);

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

const languageService = {
    findLanguages,
    findLanguageByIsoCode,
    getDictionary,
    findLanguageByName,
    addLanguage,
    updateLanguage,
    deleteLanguage,
    attachSignedUrls // Exported so translationService can use it too
}

export default languageService