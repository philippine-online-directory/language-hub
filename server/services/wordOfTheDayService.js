import prisma from '../prisma.js'
import { wordOfTheDayTemplate, checkWordOfTheDayTemplate } from '../jobs/helpers/emailTemplate.js'
import storageService from './storageService.js';

const getWordOfTheDay = async () => {
    const existing = await prisma.wordOfTheDay.findUnique({
        where: { id: 'current' },
        include: {
            translation: {
                include: {
                    language: { select: { name: true } },
                    author: { select: { id: true, username: true } },
                    secondaryAuthors: { select: { id: true, username: true } }
                }
            }
        }
    });

    if (!existing) throw new Error('No word of the day has been assigned yet');

    if (existing.translation.audioUrl) {
        existing.translation.audioUrl = await storageService.generateDownloadUrl(
            existing.translation.audioUrl
        );
    }

    return existing;
};

const assignWordOfTheDay = async () => {
    const pstDateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    const today = new Date(`${pstDateStr}T00:00:00+08:00`);

    const existing = await prisma.wordOfTheDay.findUnique({
        where: { id: 'current' }
    });

    if (existing) {
        const existingDateStr = new Date(existing.displayDate)
            .toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

        if (existingDateStr === pstDateStr) {
            console.log('Word of the day already assigned for today, skipping.');
            return;
        }
    }

    const eligibleCount = await prisma.translation.count({
        where: { status: 'VERIFIED', usedAsWordOfTheDay: false }
    });

    if (eligibleCount === 0) {
        await prisma.translation.updateMany({
            where: { usedAsWordOfTheDay: true },
            data: { usedAsWordOfTheDay: false }
        });
    }

    const newEligibleCount = eligibleCount === 0
        ? await prisma.translation.count({ where: { status: 'VERIFIED' } })
        : eligibleCount;

    if (newEligibleCount === 0) throw new Error('No eligible translations available');

    const translation = await prisma.translation.findFirst({
        where: { status: 'VERIFIED', usedAsWordOfTheDay: false },
        skip: Math.floor(Math.random() * newEligibleCount),
        include: {
            language: { select: { name: true } },
            author: { select: { id: true, username: true } }
        }
    });

    await prisma.$transaction([
        prisma.translation.update({
            where: { id: translation.id },
            data: { usedAsWordOfTheDay: true }
        }),
        prisma.wordOfTheDay.upsert({
            where: { id: 'current' },
            update: { displayDate: today, translationId: translation.id },
            create: { id: 'current', displayDate: today, translationId: translation.id }
        })
    ]);

    console.log(`Word of the day assigned: ${translation.wordText}`);
};

const getEmailTemplates = async (formattedDate) => {
    const wordOfTheDay = await getWordOfTheDay();
    const t = wordOfTheDay.translation;

    return {
        wordTemplate: wordOfTheDayTemplate(
            formattedDate,
            t.wordText,
            t.language.name,
            t.englishDefinition,
            t.exampleSentence
        ),
        checkTemplate: checkWordOfTheDayTemplate()
    };
};

const wordOfTheDayService = {
    getWordOfTheDay,
    assignWordOfTheDay,
    getEmailTemplates
};

export default wordOfTheDayService;