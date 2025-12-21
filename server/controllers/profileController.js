const auth = require('../middleware/auth')
const profileService = require('../services/profileService')
const handleError = require('../middleware/errorHandler')

const getMyProfile = [
    auth,
    async (req, res, next) => {
        const { id } = req.user.id

        try {
            const profile = await profileService.getMyProfile(id)

            res.status(200).json(profile)
        }
        catch (err) {
            handleError(err, req, res, next)
        }
    }
]

const getPublicProfile = [
    auth,
    async (req, res, next) => {
        const { userId } = req.params
        
        try {
            const profile = await profileService.getPublicProfile(userId)

            res.status(200).json(profile)
        }
        catch (err) {
            handleError(err, req, res, next)
        }
    }
]

const searchUsers = [
    auth,
    async (req, res, next) => {
        const { name } = req.query

        try {
            const users = await profileService.searchUsers(name)

            res.status(200).json(users)
        }
        catch (err) {
            handleError(err, req, res, next)
        }
    }
]



module.exports = {
    getMyProfile,
    getPublicProfile,
    searchUsers
}
