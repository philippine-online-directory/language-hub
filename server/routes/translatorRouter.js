import { Router } from 'express'
import translatorController from '../controllers/translatorController.js';

const translatorRouter = Router();

// GET /translate/:isoCode?word=...&direction=...
translatorRouter.get('/:isoCode', translatorController.getTranslatedWord);

export default translatorRouter;