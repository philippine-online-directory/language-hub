import prisma from '../prisma.js'
import storageService from './storageService.js'

async function contributeTranslation(userId, { languageId, wordText, ipa, englishDefinition, exampleSentence, audioUrl, partOfSpeech }){
    const language = await prisma.language.findUnique({
        where: { id: languageId },
        select: { id: true }
    });

    if (!language) {
        throw new Error('Language not found');
    }

    const contributedTranslation = await prisma.translation.create({
        data: {
            authorId: userId,
            languageId,
            wordText, 
            ipa,
            englishDefinition,
            exampleSentence,
            audioUrl: audioUrl || null,
            partOfSpeech: partOfSpeech || null,
        },
        include: {
            language: true
        }
    })

    if (contributedTranslation.audioUrl) {
        contributedTranslation.audioUrl = await storageService.generateDownloadUrl(contributedTranslation.audioUrl);
    }

    return contributedTranslation
}

async function getUserContributions(userId, page = 1, limit = 20){
    if (!userId) throw new Error('Must be logged in to view contributions');
    
    const skip = (page - 1) * limit;
    
    const where = {
        authorId: userId
    };

    const [contributions, total] = await Promise.all([
        prisma.translation.findMany({
            where,
            include: {
                language: true
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.translation.count({ where })
    ]);

    const contributionsWithSignedUrls = await Promise.all(
        contributions.map(async (contribution) => {
            if (contribution.audioUrl) {
                const signedUrl = await storageService.generateDownloadUrl(contribution.audioUrl);
                return {
                    ...contribution,
                    audioUrl: signedUrl,
                };
            }
            return contribution;
        })
    );

    return {
        contributions: contributionsWithSignedUrls,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

const contributeService = {
    contributeTranslation,
    getUserContributions
}

export default contributeService