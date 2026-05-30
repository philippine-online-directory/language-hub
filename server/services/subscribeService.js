import prisma from '../prisma.js'

async function subscribe(email) {
    const existing = await prisma.guestEmailSubscription.findUnique({
        where: { email }
    });

    if (existing) {
        if (!existing.active) {
            await prisma.guestEmailSubscription.update({
                where: { email },
                data: { active: true }
            });
        }
        return;
    }

    await prisma.guestEmailSubscription.create({
        data: { email }
    });
}

async function unsubscribe(token) {
    const record = await prisma.guestEmailSubscription.findUnique({
        where: { unsubscribeToken: token }
    });

    if (!record) throw new Error('Invalid unsubscribe token');

    await prisma.guestEmailSubscription.update({
        where: { unsubscribeToken: token },
        data: { active: false }
    });
}

const subscribeService = { subscribe, unsubscribe };

export default subscribeService;
