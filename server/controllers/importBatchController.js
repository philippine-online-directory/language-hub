import multer from 'multer'
import auth from '../middleware/auth.js'
import { isAdmin } from '../middleware/roleAuth.js'
import importBatchService from '../services/importBatchService.js'

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const name = file.originalname.toLowerCase();
        if (name.endsWith('.csv') || name.endsWith('.xlsx')) {
            cb(null, true);
            return;
        }
        cb(new Error('Only CSV and XLSX files are supported'));
    }
});

function handleImportError(err, res, next) {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ message: 'Import file must be 5 MB or smaller' });
        }
        return res.status(400).json({ message: err.message });
    }

    if (err.message === 'Only CSV and XLSX files are supported') {
        return res.status(400).json({ message: err.message });
    }

    if (err.statusCode) {
        return res.status(err.statusCode).json({ message: err.message });
    }

    if (
        err.message === 'Import batch not found' ||
        err.message === 'Only pending batches can be approved' ||
        err.message === 'Only pending batches can be rejected' ||
        err.message === 'Only approved batches can be rolled back'
    ) {
        return res.status(400).json({ message: err.message });
    }

    next(err);
}

const createImportBatch = [
    auth,
    (req, res, next) => {
        upload.single('file')(req, res, (err) => {
            if (err) return handleImportError(err, res, next);
            next();
        });
    },
    async (req, res, next) => {
        try {
            const batch = await importBatchService.createImportBatch(req.user, {
                languageId: req.body.languageId,
                rightsConfirmed: req.body.rightsConfirmed === 'true',
                file: req.file
            });

            res.status(201).json(batch);
        } catch (err) {
            handleImportError(err, res, next);
        }
    }
];

const getUserImportBatches = [
    auth,
    async (req, res, next) => {
        const { page = 1, limit = 20 } = req.query;

        try {
            const result = await importBatchService.getUserImportBatches(
                req.user.id,
                Number(page),
                Number(limit)
            );

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
];

const getAdminImportBatches = [
    auth,
    isAdmin,
    async (req, res, next) => {
        const { page = 1, limit = 20, status, languageId } = req.query;

        try {
            const result = await importBatchService.getAdminImportBatches({
                page: Number(page),
                limit: Number(limit),
                status,
                languageId
            });

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
];

const getImportBatch = [
    auth,
    async (req, res, next) => {
        try {
            const batch = await importBatchService.getImportBatch(req.params.batchId, req.user);
            res.status(200).json(batch);
        } catch (err) {
            handleImportError(err, res, next);
        }
    }
];

const approveImportBatch = [
    auth,
    isAdmin,
    async (req, res, next) => {
        try {
            const batch = await importBatchService.approveImportBatch(req.params.batchId, req.user.id);
            res.status(200).json(batch);
        } catch (err) {
            handleImportError(err, res, next);
        }
    }
];

const rejectImportBatch = [
    auth,
    isAdmin,
    async (req, res, next) => {
        try {
            const batch = await importBatchService.rejectImportBatch(req.params.batchId, req.user.id);
            res.status(200).json(batch);
        } catch (err) {
            handleImportError(err, res, next);
        }
    }
];

const rollbackImportBatch = [
    auth,
    isAdmin,
    async (req, res, next) => {
        try {
            const batch = await importBatchService.rollbackImportBatch(req.params.batchId, req.user.id);
            res.status(200).json(batch);
        } catch (err) {
            handleImportError(err, res, next);
        }
    }
];

const importBatchController = {
    createImportBatch,
    getUserImportBatches,
    getAdminImportBatches,
    getImportBatch,
    approveImportBatch,
    rejectImportBatch,
    rollbackImportBatch
};

export default importBatchController;
