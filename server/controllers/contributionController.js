import auth from '../middleware/auth.js'
import contributeService from '../services/contributeService.js'
import { body, matchedData } from 'express-validator' 
import prisma from '../prisma.js'
import validationErrorCheck from '../middleware/expressValidate.js'

const validateContribution = [
    body('wordText').notEmpty()
        .trim(),
    body('ipa')
        .optional({ checkFalsy: true })
        .trim(),
    body('englishDefinition').notEmpty()
        .trim(),
    body('exampleSentence').notEmpty()
        .trim(),
    body('audioUrl') 
        .optional({ checkFalsy: true })
        .trim(),
    body('languageId').notEmpty()
        .custom(async id => {
            const language = await prisma.language.findUnique({
                where: { id }
            })
            
            if (!language) throw new Error('Language does not exist')
        }),
    body('partOfSpeech')
        .optional({ checkFalsy: true })
        .trim()
]

const contributeTranslation = [
    auth,
    validateContribution,
    validationErrorCheck,
    async (req, res, next) => {
        const { id } = req.user
        const translationData = matchedData(req);

        try {
            // translationData now includes audioUrl
            const contributedTranslation = await contributeService.contributeTranslation(id, translationData)

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