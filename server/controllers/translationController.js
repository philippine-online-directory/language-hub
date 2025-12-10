const auth = require('../middleware/auth')
const translationService = require('../services/translationService')

const getTranslationInfo = [
    auth,
    async (req, res, next) => {
        const { translationId } = req.params

        try {
            const translation = await translationService.findTranslationInfo(Number(translationId))

            if (!translation) {
                return res.status(404).json({ message: "Translation not found" })
            }

            res.status(200).json(translation)
        }
        catch (err) {
            console.error(err)
            next(err)
        }
    }
]

const searchTranslations = [
    auth,
    async (req, res, next) => {
        const { isoCode } = req.params;
        const { text, definition } = req.query;

        try {
            if (!text && !definition) {
                return res.status(400).json({
                    message: "Provide ?text= OR ?definition="
                });
            }

            let results;

            if (text) {
                results = await translationService.searchTranslationByWordText(isoCode, text);
            } 
            else if (definition) {
                results = await translationService.searchTranslationByWordDefinition(isoCode, definition);
            }

            res.status(200).json(results);
        }
        catch (err) {
            console.error(err);
            next(err);
        }
    }
];

module.exports = {
    getTranslationInfo,
    searchTranslations
}

