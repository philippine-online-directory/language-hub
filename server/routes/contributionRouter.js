import { Router } from 'express'
import contributionController from '../controllers/contributionController.js'
const contributionRouter = Router();


contributionRouter.get('/', contributionController.getUserContributions)
contributionRouter.post('/', contributionController.contributeTranslation)

export default contributionRouter