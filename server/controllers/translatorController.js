import translatorService from '../services/translatorService.js'

const getTranslatedWord = [
    async (req, res, next) => {
        const { isoCode } = req.params;
        const { word, direction } = req.query;

        try {
            if (!word || !word.trim()) {
                return res.status(400).json({ error: 'Word is required' });
            }

            const results = await translatorService.translateWord(isoCode, word, direction);
            res.status(200).json({ results });
        } catch (err) {
            if (err.message === 'MULTI_WORD') {
                return res.status(400).json({ error: 'MULTI_WORD' });
            }
            next(err);
        }
    }
];

const translatorController = {
    getTranslatedWord
};

export default translatorController;