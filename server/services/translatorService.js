import prisma from '../prisma.js'

async function translateWord(slug, word, direction) {
    if (!word || !word.trim()) {
        throw new Error('Word is required');
    }

    const trimmed = word.trim();

    if (direction !== 'en-to-lang' && direction !== 'lang-to-en') {
        throw new Error('Direction must be "en-to-lang" or "lang-to-en"');
    }

    let whereClause;

    if (direction === 'en-to-lang') {
        whereClause = {
            language: { slug },
            englishDefinition: {
                equals: trimmed,
                mode: 'insensitive'
            }
        };
    } else {
        whereClause = {
            language: { slug },
            wordText: {
                equals: trimmed,
                mode: 'insensitive'
            }
        };
    }

    const translations = await prisma.translation.findMany({
        where: whereClause,
        include: {
            language: {
                select: { id: true, name: true, isoCode: true }
            },
            author: {
                select: { id: true, username: true }
            }
        },
        orderBy: [
            { status: 'desc' }, 
            { createdAt: 'desc' }
        ]
    });

    return translations;
}

const translatorService = {
    translateWord
};

export default translatorService;