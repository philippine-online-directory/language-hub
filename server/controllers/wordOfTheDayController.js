import wordOfTheDayService from '../services/wordOfTheDayService.js';

const getWordOfTheDay = [
    async (req, res, next) => {
        try {
            const wordOfTheDay = await wordOfTheDayService.getWordOfTheDay();

            res.status(200).json({
                id:          wordOfTheDay.id,
                displayDate: wordOfTheDay.displayDate,
                translation: wordOfTheDay.translation 
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