const auth = require('./auth')

const isAdmin = [
    auth,
    (req, res, next) => {
        if (req.user.role === "ADMIN"){
            next();
        }
        else {
            return res.status(403).json({ error: 'Not an admin' }); 
        }
    }
]

module.exports = {
    isAdmin
}