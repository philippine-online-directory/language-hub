import wordOfTheDayService from '../services/wordOfTheDayService.js';

const getWordOfTheDay = [
    async (req, res, next) => {
        try {
            const wordOfTheDay = await wordOfTheDayService.getWordOfTheDay();

            res.status(200).json({
                id:          wordOfTheDay.id,
                displayDate: wordOfTheDay.displayDate,
                translation: {
                    id:                wordOfTheDay.translation.id,
                    wordText:          wordOfTheDay.translation.wordText,
                    ipa:               wordOfTheDay.translation.ipa,
                    englishDefinition: wordOfTheDay.translation.englishDefinition,
                    exampleSentence:   wordOfTheDay.translation.exampleSentence,
                    partOfSpeech:      wordOfTheDay.translation.partOfSpeech,
                    audioUrl:          wordOfTheDay.translation.audioUrl,
                    status:            wordOfTheDay.translation.status,
                    author:            wordOfTheDay.translation.author
                }
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