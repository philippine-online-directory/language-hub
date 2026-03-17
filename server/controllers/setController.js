import setService from '../services/setService.js'
import auth from '../middleware/auth.js'

const getUserSets = [
    auth,
    async (req, res, next) => {
        const { id } = req.user;

        try {
            const sets = await setService.getUserSets(id);

            res.status(200).json(sets)
        }
        catch (err) {
            next(err)
        }
    }
]

const getPublicSets = [
    async (req, res, next) => {
        const { name } = req.query;

        try {
            const sets = await setService.getPublicSets(name);

            res.status(200).json(sets);
        }
        catch (err){
            next(err)
        }
    }
]

const getSetById = [
    async (req, res, next) => {
        const setId = req.params.setId || req.params.vocabSetId;

        try {
            const set = await setService.getSetById(setId);

            res.status(200).json(set);
        }
        catch (err) {
            next(err)
        }
    }
]

const createSet = [
    auth,
    async (req, res, next) => {
        const { id } = req.user;
        const { name, description, languageId } = req.body;

        try {
            const newSet = await setService.createSet(name, description, languageId, id);

            res.status(201).json(newSet);
        }
        catch (err) {
            next(err)
        }
    }
]

const updateSet = [
    auth,
    async (req, res, next) => {
        const setId = req.params.setId || req.params.vocabSetId;
        const { id } = req.user;
        const { name, description, isPublic } = req.body;

        try {
            const updatedSet = await setService.updateSet(setId, { name, description, isPublic }, id);

            res.status(200).json(updatedSet);
        }
        catch (err) {
            next(err)
        }
    }
]

const getSetWords = [
    async (req, res, next) => {
        const setId = req.params.setId || req.params.vocabSetId;
        
        try {
            const translations = await setService.getSetWords(setId);

            res.status(200).json(translations);
        }
        catch (err) {
            next(err)
        }
    }
]

const deleteSet = [
    auth, 
    async (req, res, next) => {
        const setId = req.params.setId || req.params.vocabSetId;
        const { id } = req.user;

        try {
            const deletedSet = await setService.deleteSet(setId, id);

            res.status(200).json(deletedSet);
        }
        catch (err) {
            next(err)
        }
    }
]

const getSetsContainingTranslation = [
    async (req, res, next) => {
        const { translationId } = req.params;

        try {
            const sets = await setService.getSetsContainingTranslation(translationId);
            res.status(200).json(sets);
        }
        catch (err) {
            next(err)
        }
    }
]

const setController = {
    getUserSets,
    getPublicSets,
    getSetById,
    createSet,
    updateSet,
    getSetWords,
    deleteSet,
    getSetsContainingTranslation
}

export default setController