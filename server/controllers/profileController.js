import auth from '../middleware/auth.js'
import profileService from '../services/profileService.js'

const getMyProfile = [
    auth,
    async (req, res, next) => {
        const { id } = req.user

        try {
            const profile = await profileService.getMyProfile(id)

            res.status(200).json(profile)
        }
        catch (err) {
            next(err)
        }
    }
]

const setMyProfile = [
    auth,
    async (req, res, next) => {
        const { id } = req.user
        const updates = req.body

        try {
            await profileService.setMyProfile(id, updates)
            res.status(200).json({ message: "Profile updated successfully" })
        }
        catch (err) {
            next(err)
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
            next(err)
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
            next(err)
        }
    }
]



const profileController = {
    getMyProfile,
    setMyProfile,
    getPublicProfile,
    searchUsers
}

export default profileController
