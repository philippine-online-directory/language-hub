import prisma from '../prisma.js'

export async function findCommonWordMatch(englishDefinition) {
    if (!englishDefinition) return null;

    const cleaned = englishDefinition
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .trim()
        .split(' ')[0];

    const match = await prisma.commonWord.findFirst({
        where: {
            word: cleaned
        }
    });

    return match;
}

export async function getCommonWords(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [commonWords, total] = await Promise.all([
        prisma.commonWord.findMany({
            skip,
            take: limit,
            orderBy: { id: 'asc' }
        }),
        prisma.commonWord.count()
    ]);

    return {
        commonWords,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

export async function getMissingCommonWords(isoCode, page = 1, limit = 20) {
    const language = await prisma.language.findUnique({
        where: { isoCode },
        select: { id: true }
    });

    if (!language) {
        const err = new Error('Language not found');
        err.statusCode = 404;
        throw err;
    }

    const skip = (page - 1) * limit;
    const where = {
        translations: {
            none: {
                language: { isoCode }
            }
        }
    };

    const [commonWords, total] = await Promise.all([
        prisma.commonWord.findMany({
            where,
            skip,
            take: limit,
            orderBy: { id: 'asc' }
        }),
        prisma.commonWord.count({ where })
    ]);

    return {
        commonWords,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

const commonWordService = {
    findCommonWordMatch,
    getCommonWords,
    getMissingCommonWords
};

export default commonWordService;
