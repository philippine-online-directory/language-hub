import wordOfTheDayService from '../services/wordOfTheDayService.js';

const getWordOfTheDay = [
    async (req, res, next) => {
        try {
            const translation = await wordOfTheDayService.getWordOfTheDay();

            res.status(200).json({
                id:                translation.id,
                wordText:          translation.wordText,
                ipa:               translation.ipa,
                englishDefinition: translation.englishDefinition,
                exampleSentence:   translation.exampleSentence,
                audioUrl:          translation.audioUrl,
                partOfSpeech:      translation.partOfSpeech,
                status:            translation.status,
                author: translation.author ? {
                    id:       translation.author.id,
                    username: translation.author.username
                } : null
            });
        }
        catch (err) {
            next(err);
        }
    }
];

const wordOfTheDayController = {
    getWordOfTheDay
};

export default wordOfTheDayController;