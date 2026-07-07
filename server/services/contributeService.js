import prisma from '../prisma.js'
import storageService from './storageService.js'
import { findCommonWordMatch } from './commonWordService.js'

const LANGUAGE_SUMMARY_SELECT = {
    id: true,
    name: true,
    isoCode: true,
    slug: true
};

async function contributeTranslation(
    userId,
    {
        languageId,
        wordText,
        englishDefinition,
        exampleSentence,
        audioUrl,
        partOfSpeech,
        usageComment
    }
) {
    const language = await prisma.language.findUnique({
        where: { id: languageId },
        select: { id: true }
    });

    if (!language) {
        throw new Error('Language not found');
    }

    // Try to match to top 3000 words
    const commonWord = await findCommonWordMatch(englishDefinition);

    // Check before inserting whether this common word is already covered for this language
    const isFirstCoverage = commonWord
        ? (await prisma.translation.count({ where: { languageId, commonWordId: commonWord.id } })) === 0
        : false;

    const contributedTranslation = await prisma.translation.create({
        data: {
            authorId: userId,
            languageId,
            wordText,
            englishDefinition,
            exampleSentence: exampleSentence || null,
            audioUrl: audioUrl || null,
            partOfSpeech: partOfSpeech || null,
            commonWordId: commonWord ? commonWord.id : null,
            usageComment: usageComment || null
        },
        include: {
            language: { select: LANGUAGE_SUMMARY_SELECT }
        }
    });

    if (isFirstCoverage) {
        await prisma.language.update({
            where: { id: languageId },
            data: { completionCount: { increment: 1 } }
        });
    }

    if (contributedTranslation.audioUrl) {
        contributedTranslation.audioUrl =
            await storageService.generateDownloadUrl(
                contributedTranslation.audioUrl
            );
    }

    return contributedTranslation;
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
                language: { select: LANGUAGE_SUMMARY_SELECT }
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
