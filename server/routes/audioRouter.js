import { Router } from 'express'
import audioController from '../controllers/audioController.js'

const audioRouter = Router();

audioRouter.post('/upload-url', audioController.getUploadUrl)

export default audioRouter