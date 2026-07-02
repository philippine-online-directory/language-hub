import { Router } from 'express'
import importBatchController from '../controllers/importBatchController.js'

const importBatchRouter = Router();

importBatchRouter.post('/', importBatchController.createImportBatch);
importBatchRouter.post('/preview', importBatchController.previewImportFile);
importBatchRouter.get('/', importBatchController.getUserImportBatches);

importBatchRouter.get('/admin', importBatchController.getAdminImportBatches);
importBatchRouter.patch('/admin/:batchId/approve', importBatchController.approveImportBatch);
importBatchRouter.patch('/admin/:batchId/reject', importBatchController.rejectImportBatch);
importBatchRouter.patch('/admin/:batchId/rollback', importBatchController.rollbackImportBatch);

importBatchRouter.get('/:batchId', importBatchController.getImportBatch);

export default importBatchRouter;
