import prisma from '../prisma.js'

async function contributeTranslation(userId, wordText, ipa, englishDefinition, exampleSentence, languageName){
    const language = await prisma.language.findUnique({
        where: { name: languageName },
        select: { id: true }
    });

    if (!language) {
        throw new Error('Language not found');
    }

    const contributedTranslation = await prisma.translation.create({
        data: {
            authorId: userId,
            languageId: language.id,
            wordText, 
            ipa,
            englishDefinition,
            exampleSentence,
        }

    })

    return contributedTranslation
}

async function getUserContributions(userId){
    if (!userId) throw new Error('Must be logged in to view contributions');
    
    const contributions = await prisma.translation.findMany({
        where: {
            authorId: userId
        }
    })

    return contributions
}

const contributeService = {
    contributeTranslation,
    getUserContributions
}

export default contributeService
