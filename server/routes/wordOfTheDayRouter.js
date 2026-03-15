import { Router } from 'express';
import wordOfTheDayController from '../controllers/wordOfTheDayController.js';

const wordOfTheDayRouter = Router();

wordOfTheDayRouter.get('/', wordOfTheDayController.getWordOfTheDay);

export default wordOfTheDayRouter;