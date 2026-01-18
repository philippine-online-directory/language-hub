import auth from '../middleware/auth.js'
import contributeService from '../services/contributeService.js'
import { body, matchedData } from 'express-validator' 
import prisma from '../prisma.js'
import validationErrorCheck from '../middleware/expressValidate.js'

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


const contributionController = {
    contributeTranslation,
    getUserContributions
}

export default contributionController