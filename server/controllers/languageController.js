import auth from '../middleware/auth.js'
import { isAdmin } from '../middleware/roleAuth.js'
import languageService from '../services/languageService.js'
import { body, matchedData } from 'express-validator'
import validationErrorCheck from '../middleware/expressValidate.js'

const validateLanguage = [
    body('name').notEmpty().trim(),
    body('speakerCount')
        .optional({ nullable: true, checkFalsy: true })
        .isInt().withMessage('Speaker count must be an integer')
        .toInt(),
    body('isoCode').notEmpty().trim(),
    body('preservationNote').trim(),
    body('culturalBackground').trim()
];

const getLanguages = [
    async (req, res, next) => {
        const { name, page, limit } = req.query;

        try {
            const languages = name
                ? await languageService.findLanguageByName(name, parseInt(page) || 1, parseInt(limit) || 20)
                : await languageService.findLanguages(parseInt(page) || 1, parseInt(limit) || 20);

            res.status(200).json(languages);
        } catch (err) {
            next(err);
        }
    }
];

const getLanguageByCode = [
    async (req, res, next) => {
        const { isoCode } = req.params;

        try {
            const language = await languageService.findLanguageByIsoCode(isoCode);

            if (!language) {
                return res.status(404).json({ error: 'Language not found' });
            }

            return res.status(200).json(language);
        } catch (err) {
            next(err);
        }
    }
];

/**
 * GET /languages/:isoCode/translations
 *
 * Query params:
 *   text           - search wordText (contains)
 *   definition     - search englishDefinition (contains)
 *   status         - 'VERIFIED' | 'ALL'         (default: 'VERIFIED')
 *   sortBy         - 'alpha-asc' | 'alpha-desc' | 'date-asc' | 'date-desc'  (default: 'alpha-asc')
 *   coreWordsOnly  - 'true' | 'false'           (default: 'false')
 *   page           - number                     (default: 1)
 *   limit          - number                     (default: 20)
 */
const getTranslations = [
    async (req, res, next) => {
        const { isoCode } = req.params;
        const {
            text,
            definition,
            status = 'VERIFIED',
            sortBy = 'alpha-asc',
            coreWordsOnly,
            page,
            limit
        } = req.query;

        // Validate sortBy — reject unknown values rather than silently ignoring them
        const VALID_SORTS = ['alpha-asc', 'alpha-desc', 'date-asc', 'date-desc'];
        const resolvedSortBy = VALID_SORTS.includes(sortBy) ? sortBy : 'alpha-asc';

        // Validate status
        const VALID_STATUSES = ['VERIFIED', 'ALL'];
        const resolvedStatus = VALID_STATUSES.includes(status) ? status : 'VERIFIED';

        try {
            const result = await languageService.getTranslations(isoCode, {
                status: resolvedStatus,
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20,
                textSearch: text || '',
                definitionSearch: definition || '',
                sortBy: resolvedSortBy,
                coreWordsOnly: coreWordsOnly === 'true'
            });

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
];

// ── Admin functions ───────────────────────────────────────────────────────────

const addLanguage = [
    auth,
    isAdmin,
    validateLanguage,
    validationErrorCheck,
    async (req, res, next) => {
        const languageData = matchedData(req);
        try {
            const addedLanguage = await languageService.addLanguage(languageData);
            res.status(201).json(addedLanguage);
        } catch (err) {
            next(err);
        }
    }
];

const updateLanguage = [
    auth,
    isAdmin,
    validateLanguage,
    validationErrorCheck,
    async (req, res, next) => {
        const { languageId } = req.params;
        const languageData = matchedData(req);
        try {
            const updatedLanguage = await languageService.updateLanguage(languageId, languageData);
            res.status(200).json(updatedLanguage);
        } catch (err) {
            next(err);
        }
    }
];

const deleteLanguage = [
    auth,
    isAdmin,
    async (req, res, next) => {
        const { languageId } = req.params;
        try {
            await languageService.deleteLanguage(languageId);
            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    }
];

const languageController = {
    getLanguages,
    getLanguageByCode,
    getTranslations,
    addLanguage,
    updateLanguage,
    deleteLanguage
};

export default languageController;