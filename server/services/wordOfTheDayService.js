import prisma from '../prisma.js'

const getWordOfTheDay = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.wordOfTheDay.findUnique({
        where: { displayDate: today },
        include: {
            translation: {
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true
                        }
                    }
                }
            }
        }
    });

    if (existing) return existing.translation;

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentlyUsed = await prisma.wordOfTheDay.findMany({
        where: { displayDate: { gte: thirtyDaysAgo } },
        select: { translationId: true }
    });

    const excludedIds = recentlyUsed.map(w => w.translationId);

    const eligibleCount = await prisma.translation.count({
        where: {
            status: 'VERIFIED',
            id: { notIn: excludedIds }
        }
    });

    if (eligibleCount === 0) throw new Error('No eligible translations available');

    const randomSkip = Math.floor(Math.random() * eligibleCount);

    const translation = await prisma.translation.findFirst({
        where: {
            status: 'VERIFIED',
            id: { notIn: excludedIds }
        },
        skip: randomSkip,
        include: {
            author: {
                select: {
                    id: true,
                    username: true
                }
            }
        }
    });

    await prisma.wordOfTheDay.create({
        data: {
            translationId: translation.id,
            displayDate:   today
        }
    });

    return translation;
};

const wordOfTheDayService = {
    getWordOfTheDay
};

export default wordOfTheDayService;