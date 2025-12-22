const auth = require('../middleware/auth')
const { isAdmin } = require('../middleware/roleAuth')
const contributeService = require('../services/contributeService')
const { body, matchedData } = require('express-validator')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();
const validationErrorCheck = require('../middleware/expressValidate')

const validateContribution = [
    body('wordText').notEmpty()
        .isAlpha()
        .trim(),
    body('ipa').notEmpty()
        .isAlpha()
        .trim(),
    body('englishDefinition').notEmpty()
        .isAlpha()
        .trim(),
    body('exampleSentence').notEmpty()
        .isAlpha()
        .trim(),
    body('languageName').notEmpty()
        .isAlpha()
        .trim()
        .custom(async name => {
            const language = await prisma.language.findUnique({
                where: { name }
            })
            
            if (!language) throw new Error('Language does not exist')
        })
]

const contributeTranslation = [
    auth,
    validateContribution,
    validationErrorCheck,
    async (req, res, next) => {
        const { id } = req.user
        const { wordText, 
            ipa,
            englishDefinition,
            exampleSentence,
            languageName
        } = matchedData(req);

        try {
            const contributedTranslation = await contributeService.contributeTranslation(id, 
                wordText,
                ipa,
                englishDefinition,
                exampleSentence,
                languageName
            )

            res.status(201).json(contributedTranslation)
        }
        catch (err) {
            next(err)
        }
    }
]

const getUserContributions = [
    auth,
    async (req, res, next) => {
        const { id } = req.user

        try {
            const contributions = await contributeService.getUserContributions(id);

            res.status(200).json(contributions)
        }
        catch (err) {
            next(err)
        }
    }
]



module.exports = {
    contributeTranslation,
    getUserContributions
}