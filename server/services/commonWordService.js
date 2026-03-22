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