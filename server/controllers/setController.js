const setService = require('../services/setService')

const getUserSets = [
    auth,
    async (req, res, next) => {
        const { id } = req.user;

        try {
            const sets = await setService.getUserSets(id);

            res.status(200).json(sets)
        }
        catch (err) {
            console.error(err);
            next(err);
        }
    }
]

const createSet = [
    auth,
    async (req, res, next) => {
        const { id } = req.user;
        const { name, description } = req.body;

        try {
            const newSet = await setService.createSet(name, description, id);

            res.status(201).json(newSet);
        }
        catch (err) {
            console.error(err);
            next(err);
        }
    }
]

const getSetWords = [
    auth,
    async (req, res, next) => {
        const { setId } = req.params;
        
        try {
            const translations = await setService.getSetWords(setId);

            res.status(200).json(translations);
        }
        catch (err) {
            console.error(err);
            next(err);
        }
    }
]

const publishSet = [
    auth,
    async (req, res, next) => {
        const { setId } = req.params;

        try {
            const publishedSet = await setService.publishSet(setId);

            res.status(200).json(publishedSet);
        }
        catch (err) {
            console.error(err);
            next(err);
        }
    }
]

const deleteSet = [
    auth, 
    async (req, res, next) => {
        const { setId } = req.params;
        const { id } = req.user;

        try {
            const deletedSet = await setService.deleteSet(setId, id);

            res.status(200).json(deletedSet);
        }
        catch (err) {
            console.error(err);
            next(err);
        }
    }
]

module.exports = {
    getUserSets,
    createSet,
    getSetWords,
    publishSet,
    deleteSet
}