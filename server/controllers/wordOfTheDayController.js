import wordOfTheDayService from '../services/wordOfTheDayService.js';

const isWordOfTheDayEnabled = () => false;

const getWordOfTheDay = [
    async (req, res, next) => {
        try {
            if (!isWordOfTheDayEnabled()) {
                return res.status(503).json({
                    message: 'Word of the Day is currently disabled'
                });
            }

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
