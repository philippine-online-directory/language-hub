import prisma from '../prisma.js'
import storageService from './storageService.js'
import { findCommonWordMatch } from './commonWordService.js'
import { createTranslationWithSlug } from '../utils/translationSlug.js'

const LANGUAGE_SUMMARY_SELECT = {
    id: true,
    name: true,
    isoCode: true,
    slug: true
};

const COMPLETABLE_FIELDS = [
    'exampleSentence',
    'audioUrl',
    'partOfSpeech',
    'usageComment'
];

export async function contributeTranslation(
    userId,
    {
        languageId,
        wordText,
        englishDefinition,
        exampleSentence,
        englishExampleSentence,
        audioUrl,
        partOfSpeech,
        usageComment
    },
    prismaClient = prisma,
    findCommonWord = findCommonWordMatch
) {
    const language = await prismaClient.language.findUnique({
        where: { id: languageId },
        select: { id: true }
    });

    if (!language) {
        throw new Error('Language not found');
    }

    // Try to match to top 3000 words
    const commonWord = await findCommonWord(englishDefinition);

    // Check before inserting whether this common word is already covered for this language
    const isFirstCoverage = commonWord
        ? (await prismaClient.translation.count({ where: { languageId, commonWordId: commonWord.id } })) === 0
        : false;

    const contributedTranslation = await createTranslationWithSlug(prismaClient, {
        data: {
            authorId: userId,
            languageId,
            wordText,
            englishDefinition,
            exampleSentence: exampleSentence || null,
            englishExampleSentence: exampleSentence && englishExampleSentence
                ? englishExampleSentence
                : null,
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
        await prismaClient.language.update({
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

export async function completeMissingTranslationFields(
    userId,
    translationId,
    proposedData,
    prismaClient = prisma
) {
    const translation = await prismaClient.translation.findUnique({
        where: { id: translationId },
        select: {
            authorId: true,
            exampleSentence: true,
            audioUrl: true,
            partOfSpeech: true,
            usageComment: true,
            secondaryAuthors: {
                where: { id: userId },
                select: { id: true }
            }
        }
    });

    if (!translation) throw new Error('Translation does not exist');

    const safeData = Object.fromEntries(
        COMPLETABLE_FIELDS.flatMap((field) => {
            const value = proposedData[field];
            return translation[field] == null && typeof value === 'string' && value.trim()
                ? [[field, value.trim()]]
                : [];
        })
    );

    if (Object.keys(safeData).length === 0) {
        throw new Error('No missing fields were provided');
    }

    const shouldCreditContributor =
        translation.authorId !== userId && translation.secondaryAuthors.length === 0;

    const updatedTranslation = await prismaClient.translation.update({
        where: {
            id: translationId,
            ...Object.fromEntries(Object.keys(safeData).map((field) => [field, null]))
        },
        data: {
            ...safeData,
            ...(shouldCreditContributor
                ? { secondaryAuthors: { connect: { id: userId } } }
                : {})
        },
        include: {
            language: true,
            author: true,
            secondaryAuthors: true
        }
    });

    if (updatedTranslation.audioUrl) {
        updatedTranslation.audioUrl = await storageService.generateDownloadUrl(
            updatedTranslation.audioUrl
        );
    }

    return updatedTranslation;
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
    completeMissingTranslationFields,
    getUserContributions
}

export default contributeService
