const auth = require('../middleware/auth')
const profileService = require('../services/profileService')

const getProfile = [
    auth,
    async (req, res, next) => {
        const requestedId = req.params.id;
        const sessionUserId = req.user.id;

        try {
            if (requestedId === sessionUserId) {
                const fullProfile = await profileService.getMyProfile(requestedId);
                return res.status(200).json(fullProfile);
            }

            const publicProfile = await profileService.getPublicProfile(requestedId);
            res.status(200).json(publicProfile)
        }
        catch (err) {
            console.error(err)
            next(err)
        }

    }
]

module.exports = getProfile;
