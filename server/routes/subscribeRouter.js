import { Router } from 'express';
import subscribeController from '../controllers/subscribeController.js';

const subscribeRouter = Router();

subscribeRouter.post('/', subscribeController.subscribe);
subscribeRouter.get('/unsubscribe', subscribeController.unsubscribe);

export default subscribeRouter;
