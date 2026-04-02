import auth from '../middleware/auth.js'
import { isAdmin } from '../middleware/roleAuth.js'
import translationUpdateRequestService from "../services/translationUpdateRequest.js";

const addTranslationUpdateRequest = [
  auth,
  async (req, res, next) => {
    try {
      const { translationId, proposedData } = req.body
      const submittedById = req.user.id

      const request = await translationUpdateRequestService.addTranslationUpdateRequest({
        translationId,
        submittedById,
        proposedData,
      })

      res.status(201).json(request)
    } catch (err) {
      next(err)
    }
  },
]

// Admin Features

const acceptTranslationUpdateRequest = [
  auth,
  isAdmin,
  async (req, res, next) => {
    try {
      const { requestId } = req.params

      const updatedTranslation =
        await translationUpdateRequestService.acceptTranslationUpdateRequest(requestId)

      res.status(200).json(updatedTranslation)
    } catch (err) {
      if (err.message === 'Update request not found' || err.message === 'Translation not found') {
        return res.status(404).json({ error: err.message });
      }

      return res.status(500).json({ error: err.message });
    }
  },
]

const deleteTranslationUpdateRequest = [
  auth,
  isAdmin,
  async (req, res, next) => {
    try {
      const { requestId } = req.params

      await translationUpdateRequestService.deleteTranslationUpdateRequest(requestId)

      res.sendStatus(204)
    } catch (err) {
      if (err.message === 'Update request not found') {
        return res.status(404).json({ error: err.message });
      }

      return res.status(500).json({ error: err.message });
    }
  },
]

const getTranslationUpdateRequests = [
  auth,
  isAdmin,
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20 } = req.query

      const result = await translationUpdateRequestService.getTranslationUpdateRequests(
        Number(page),
        Number(limit),
      )

      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },
]


const translationUpdateRequestController = {
  addTranslationUpdateRequest,
  acceptTranslationUpdateRequest,
  deleteTranslationUpdateRequest,
  getTranslationUpdateRequests,
}

export default translationUpdateRequestController