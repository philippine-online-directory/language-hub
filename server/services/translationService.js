import prisma from '../prisma.js'
import storageService from './storageService.js'

const LANGUAGE_SUMMARY_SELECT = {
    id: true,
    name: true,
    isoCode: true,
    slug: true
};

export async function findPublicTranslationBySlug(languageSlug, wordSlug, prismaClient = prisma) {
    const language = await prismaClient.language.findUnique({
        where: { slug: languageSlug },
        select: LANGUAGE_SUMMARY_SELECT
    });

    if (!language) return null;

    const translation = await prismaClient.translation.findUnique({
        where: {
            languageId_slug: {
                languageId: language.id,
                slug: wordSlug
            }
        },
        select: {
            id: true,
            slug: true,
            wordText: true,
            englishDefinition: true,
            exampleSentence: true,
            englishExampleSentence: true,
            status: true,
            createdAt: true,
            publishedAt: true,
            audioUrl: true,
            partOfSpeech: true,
            usageComment: true,
            author: {
                select: { id: true, username: true }
            },
            secondaryAuthors: {
                select: { id: true, username: true }
            },
            setWords: {
                where: { vocabSet: { isPublic: true } },
                select: {
                    vocabSet: {
                        select: {
                            id: true,
                            name: true,
                            description: true
                        }
                    }
                }
            }
        }
    });

    if (!translation) return null;

    const { author, secondaryAuthors, setWords, ...fields } = translation;
    const audioUrl = fields.audioUrl
        ? await storageService.generateDownloadUrl(fields.audioUrl)
        : null;

    return {
        ...fields,
        audioUrl,
        language,
        contributors: [author, ...secondaryAuthors],
        publicSets: setWords.map(({ vocabSet }) => vocabSet)
    };
}

async function findTranslationInfo(id) {
    const translation = await prisma.translation.findUnique({
        where: { id },
        include: {
            author: {
                select: { id: true, username: true }
            }
        }
    });

    if (!translation) throw new Error('Translation does not exist');

    if (translation.audioUrl) {
        translation.audioUrl = await storageService.generateDownloadUrl(translation.audioUrl);
    }

    return translation;
}

async function addTranslationToSet(vocabSetId, translationId, userId) {
    const vocabSet = await prisma.vocabSet.findUnique({
        where: { id: vocabSetId }
    });

    if (!vocabSet) throw new Error(`Vocab set ID ${vocabSetId} not found.`);

    if (vocabSet.ownerId !== userId) {
        throw new Error("Permission denied: You can only add translations to sets you've created.");
    }

    const translation = await prisma.translation.findUnique({
        where: { id: translationId }
    });

    if (!translation) throw new Error(`Translation ID ${translationId} not found`);

    const existingEntry = await prisma.setWord.findUnique({
        where: {
            translationId_vocabSetId: { translationId, vocabSetId }
        }
    });

    if (existingEntry) throw new Error('This translation is already in the vocabulary set.');

    const newSetWord = await prisma.setWord.create({
        data: { vocabSetId, translationId },
        include: {
            translation: {
                select: { wordText: true, englishDefinition: true }
            }
        }
    });

    return newSetWord;
}

async function removeTranslationFromSet(vocabSetId, translationId, userId) {
    const vocabSet = await prisma.vocabSet.findUnique({
        where: { id: vocabSetId }
    });

    if (!vocabSet) throw new Error(`Vocab set ID ${vocabSetId} not found.`);

    if (vocabSet.ownerId !== userId) {
        throw new Error("Permission denied: You can only remove translations from sets you've created.");
    }

    await prisma.setWord.delete({
        where: {
            translationId_vocabSetId: { translationId, vocabSetId }
        }
    });
}

async function updateTranslationStatus(id, status) {
    if (status !== 'VERIFIED' && status !== 'UNVERIFIED') {
        throw new Error('Status must be "VERIFIED" or "UNVERIFIED"');
    }

    try {
        const updatedTranslation = await prisma.translation.update({
            where: { id },
            data: {
                status,
                ...(status === 'VERIFIED' ? { publishedAt: new Date() } : {})
            }
        });
        return updatedTranslation;
    } catch (err) {
        if (err.code === 'P2025') throw new Error('Translation does not exist');
        throw err;
    }
}

async function deleteTranslation(id) {
    const translation = await prisma.translation.findUnique({
        where: { id },
        select: { id: true, audioUrl: true }
    });

    if (!translation) throw new Error('Translation does not exist');

    try {
        await prisma.translation.delete({ where: { id } });
    } catch (err) {
        if (err.code === 'P2025') throw new Error('Translation does not exist');
        throw err;
    }

    if (translation.audioUrl) {
        await storageService.deleteAudioFile(translation.audioUrl);
    }
}

const translationService = {
    findPublicTranslationBySlug,
    findTranslationInfo,
    addTranslationToSet,
    removeTranslationFromSet,
    updateTranslationStatus,
    deleteTranslation
};

export default translationService;
