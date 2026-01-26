import prisma from '../prisma.js'

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
                email: true,
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

async function getMyProfile(userId){
    if (!userId) throw new Error("Must be logged in to view your profile");

    const myProfile = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            email: true,
            username: true,
            createdAt: true,
            role: true,
            _count: {
                select: {
                    contributions: true,
                    createdSets: true,
                    gameScores: true
                }
            },
            contributions: {
                include: {
                    language: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            },
            createdSets: {
                include: {
                    language: true,
                    _count: {
                        select: {
                            setWords: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    })

    return myProfile
}

async function getPublicProfile(userId){
    const user = await prisma.user.findUnique({
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
            },
            contributions: {
                where: {
                    status: 'VERIFIED'
                },
                include: {
                    language: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            },
            createdSets: {
                where: {
                    isPublic: true
                },
                include: {
                    language: true,
                    _count: {
                        select: {
                            setWords: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    });
    
    return user;
}

const profileService = {
    getMyProfile,
    getPublicProfile,
    searchUsers
}

export default profileService