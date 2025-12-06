const auth = require('./auth')

const isContributor = [
    auth,
    (req, res, next) => {
        if (req.user.role === "CONTRIBUTOR"){
            next();
        }
        else {
            return res.status(401).json({ error: 'Not a contributor' });
        }
    }
]

const isAdmin = [
    auth,
    (req, res, next) => {
        if (req.user.role === "ADMIN"){
            next();
        }
        else {
            return res.status(401).json({ error: 'Not an contributor' }); 
        }
    }
]

module.exports = {
    isContributor,
    isAdmin
}