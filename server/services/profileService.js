import prisma from '../prisma.js'

const LANGUAGE_SUMMARY_SELECT = {
    id: true,
    name: true,
    isoCode: true,
    slug: true
};

async function searchUsers(username, page = 1, limit = 20){
    const skip = (page - 1) * limit;
    
    const where = {
        username: {
            contains: username || '',
            mode: 'insensitive'
        }
    };

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id: true,
                username: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        contributions: true,
                        createdSets: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.user.count({ where })
    ]);

    return {
        users,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

async function getMyProfile(userId, { contributionsPage = 1, setsPage = 1, limit = 20 } = {}){
    if (!userId) throw new Error("Must be logged in to view your profile");

    const contributionsWhere = { authorId: userId };
    const setsWhere = { ownerId: userId };

    const [profile, contributions, contributionsTotal, createdSets, setsTotal] = await Promise.all([
        prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                email: true,
                username: true,
                createdAt: true,
                reminderType: true,
                role: true,
                _count: {
                    select: {
                        contributions: true,
                        createdSets: true,
                        gameScores: true
                    }
                }
            }
        }),
        prisma.translation.findMany({
            where: contributionsWhere,
            include: {
                language: { select: LANGUAGE_SUMMARY_SELECT }
            },
            skip: (contributionsPage - 1) * limit,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.translation.count({ where: contributionsWhere }),
        prisma.vocabSet.findMany({
            where: setsWhere,
            include: {
                language: { select: LANGUAGE_SUMMARY_SELECT },
                _count: {
                    select: {
                        setWords: true
                    }
                }
            },
            skip: (setsPage - 1) * limit,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.vocabSet.count({ where: setsWhere })
    ]);

    if (!profile) return null;

    return {
        ...profile,
        contributions,
        createdSets,
        contributionsPagination: {
            page: contributionsPage,
            limit,
            total: contributionsTotal,
            totalPages: Math.ceil(contributionsTotal / limit)
        },
        createdSetsPagination: {
            page: setsPage,
            limit,
            total: setsTotal,
            totalPages: Math.ceil(setsTotal / limit)
        }
    };
}

async function setMyProfile(userId, updates) {
  if (!userId) throw new Error("Must be logged in to update your profile");

  const { reminderType } = updates;
  const disabledReminderTypes = ['WORD', 'CHECKWORD'];

  await prisma.user.update({
    where: { id: userId },
    data: {
      reminderType: disabledReminderTypes.includes(reminderType)
        ? null
        : reminderType
    },
  });

}

async function getPublicProfile(userId, { contributionsPage = 1, setsPage = 1, limit = 20 } = {}){
    const contributionsWhere = { authorId: userId, status: 'VERIFIED' };
    const setsWhere = { ownerId: userId, isPublic: true };

    const [profile, contributions, contributionsTotal, createdSets, setsTotal] = await Promise.all([
        prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                username: true,
                createdAt: true,
                role: true,
                _count: {
                    select: {
                        contributions: true,
                        createdSets: true
                    }
                }
            }
        }),
        prisma.translation.findMany({
            where: contributionsWhere,
            include: {
                language: { select: LANGUAGE_SUMMARY_SELECT }
            },
            skip: (contributionsPage - 1) * limit,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.translation.count({ where: contributionsWhere }),
        prisma.vocabSet.findMany({
            where: setsWhere,
            include: {
                language: { select: LANGUAGE_SUMMARY_SELECT },
                _count: {
                    select: {
                        setWords: true
                    }
                }
            },
            skip: (setsPage - 1) * limit,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.vocabSet.count({ where: setsWhere })
    ]);

    if (!profile) return null;

    return {
        ...profile,
        contributions,
        createdSets,
        contributionsPagination: {
            page: contributionsPage,
            limit,
            total: contributionsTotal,
            totalPages: Math.ceil(contributionsTotal / limit)
        },
        createdSetsPagination: {
            page: setsPage,
            limit,
            total: setsTotal,
            totalPages: Math.ceil(setsTotal / limit)
        }
    };
}

const profileService = {
    getMyProfile,
    setMyProfile,
    getPublicProfile,
    searchUsers
}

export default profileService
