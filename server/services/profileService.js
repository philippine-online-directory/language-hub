const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

async function searchUsers(username){
    if (!username){
        throw new Error("Must search by username");
    }

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
            }
        }
    });
    
    return user;
}

module.exports = {
    getMyProfile,
    getPublicProfile,
    searchUsers
}

