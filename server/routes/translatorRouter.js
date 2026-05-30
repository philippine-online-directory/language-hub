import { Router } from 'express'
import translatorController from '../controllers/translatorController.js';

const translatorRouter = Router();

// GET /translate/:slug?word=...&direction=...
translatorRouter.get('/:slug', translatorController.getTranslatedWord);

export default translatorRouter;