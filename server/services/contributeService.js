const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

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

