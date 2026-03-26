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

async function addLanguage({ name, speakerCount, isoCode, preservationNote, culturalBackground }) {
    const addedLanguage = await prisma.language.create({
        data: {
            name,
            speakerCount,
            isoCode,
            preservationNote,
            culturalBackground
        }
    });
    return addedLanguage;
}

async function updateLanguage(id, { name, speakerCount, isoCode, preservationNote, culturalBackground }) {
    if (!id) throw new Error('Id missing: Must have id to identify which language to update');

    const updatedLanguage = await prisma.language.update({
        where: { id },
        data: { name, speakerCount, isoCode, preservationNote, culturalBackground }
    });
    return updatedLanguage;
}

async function deleteLanguage(id) {
    if (!id) throw new Error('Id missing: Must have id to identify which language to delete');

    try {
        await prisma.language.delete({ where: { id } });
    } catch (err) {
        if (err.code === 'P2025') throw new Error('Language does not exist');
        throw err;
    }
}

async function findLanguages(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [languages, total] = await Promise.all([
        prisma.language.findMany({
            skip,
            take: limit,
            orderBy: { name: 'asc' }
        }),
        prisma.language.count()
    ]);

    return {
        languages,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
}

async function findLanguageByIsoCode(code) {
    // Fetch language and top contributors in parallel
    const [language, contributorGroups] = await Promise.all([
        prisma.language.findUnique({
            where: { isoCode: code }
        }),
        prisma.translation.groupBy({
            by: ['authorId'],
            where: {
                language: { isoCode: code },
                status: 'VERIFIED'
            },
            _count: { authorId: true },
            orderBy: [
                { _count: { authorId: 'desc' } },
                { authorId: 'asc' }
            ],
            take: 3
        })
    ]);

    if (!language) return null;

    let topContributors = [];

    if (contributorGroups.length > 0) {
        const authorIds = contributorGroups.map(g => g.authorId);

        // Get earliest verified contribution per author for tiebreaking
        const earliestContributions = await prisma.translation.findMany({
            where: {
                language: { isoCode: code },
                status: 'VERIFIED',
                authorId: { in: authorIds }
            },
            select: { authorId: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
            distinct: ['authorId']
        });

        const earliestMap = {};
        earliestContributions.forEach(c => {
            earliestMap[c.authorId] = c.createdAt;
        });

        // Fetch user info for non-deleted authors
        const users = await prisma.user.findMany({
            where: { id: { in: authorIds } },
            select: { id: true, username: true }
        });

        const userMap = {};
        users.forEach(u => { userMap[u.id] = u.username; });

        // Build and sort: count desc, then earliest contribution asc as tiebreaker
        topContributors = contributorGroups
            .map(g => ({
                id: userMap[g.authorId] ? g.authorId : null,
                username: userMap[g.authorId] ?? 'Deleted user',
                count: g._count.authorId,
                earliestAt: earliestMap[g.authorId] ?? new Date(0)
            }))
            .sort((a, b) => {
                if (b.count !== a.count) return b.count - a.count;
                return new Date(a.earliestAt) - new Date(b.earliestAt);
            })
            .map(({ id, username, count }) => ({ id, username, count }));
    }

    return { ...language, topContributors };
}

async function findLanguageByName(phrase, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where = {
        name: { startsWith: phrase, mode: 'insensitive' }
    };

    const [languages, total] = await Promise.all([
        prisma.language.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: 'asc' }
        }),
        prisma.language.count({ where })
    ]);

    return {
        languages,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
}


async function getTranslations(isoCode, {
    status = 'VERIFIED',
    page = 1,
    limit = 20,
    textSearch,
    definitionSearch,
    sortBy = 'alpha-asc',
    coreWordsOnly = false
} = {}) {
    const skip = (page - 1) * limit;

    const whereClause = {
        language: { isoCode }
    };

    if (status === 'VERIFIED' || status === 'UNVERIFIED') {
        whereClause.status = status;
    }

    if (textSearch && textSearch.trim()) {
        whereClause.wordText = { contains: textSearch.trim(), mode: 'insensitive' };
    }

    if (definitionSearch && definitionSearch.trim()) {
        whereClause.englishDefinition = { contains: definitionSearch.trim(), mode: 'insensitive' };
    }

    if (coreWordsOnly) {
        whereClause.commonWordId = { not: null };
    }

    const SORT_MAP = {
        'alpha-asc':  { wordText: 'asc' },
        'alpha-desc': { wordText: 'desc' },
        'date-asc':   { createdAt: 'asc' },
        'date-desc':  { createdAt: 'desc' },
    };
    const orderBy = SORT_MAP[sortBy] ?? { wordText: 'asc' };

    const [translations, total] = await Promise.all([
        prisma.translation.findMany({
            where: whereClause,
            include: {
                language: true,
                author: { select: { id: true, username: true } }
            },
            skip,
            take: limit,
            orderBy
        }),
        prisma.translation.count({ where: whereClause })
    ]);

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
    findLanguageByName,
    getTranslations,
    addLanguage,
    updateLanguage,
    deleteLanguage,
    attachSignedUrls
};

export default languageService;