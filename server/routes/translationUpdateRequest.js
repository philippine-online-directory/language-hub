import { Router } from 'express'
import translationUpdateRequestController from '../controllers/translationUpdateRequest.js'

const translationUpdateRequestRouter = Router()

// User route
translationUpdateRequestRouter.post('/', translationUpdateRequestController.addTranslationUpdateRequest)

// Admin routes
translationUpdateRequestRouter.get('/', translationUpdateRequestController.getTranslationUpdateRequests)
translationUpdateRequestRouter.patch('/:requestId/accept', translationUpdateRequestController.acceptTranslationUpdateRequest)
translationUpdateRequestRouter.delete('/:requestId', translationUpdateRequestController.deleteTranslationUpdateRequest)

export default translationUpdateRequestRouter
