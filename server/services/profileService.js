import prisma from '../prisma.js'

async function searchUsers(username){
    const users = await prisma.user.findMany({
        where: {
            username: {
                startsWith: `${username}`,
                mode: 'insensitive'
            }
        }
    })

    return users
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