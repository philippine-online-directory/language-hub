import prisma from '../prisma.js'
import storageService from './storageService.js'

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
            data: { status }
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
    findTranslationInfo,
    addTranslationToSet,
    removeTranslationFromSet,
    updateTranslationStatus,
    deleteTranslation
};

export default translationService;