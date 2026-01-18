import auth from './auth.js'

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

export {
    isAdmin
}