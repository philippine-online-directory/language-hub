import path from 'path'
import { parse } from 'csv-parse/sync'
import { readSheet } from 'read-excel-file/node'
import prisma from '../prisma.js'
import { findCommonWordMatch } from './commonWordService.js'

const REQUIRED_FIELDS = ['wordText', 'englishDefinition'];
const IMPORT_FIELDS = [
    'wordText',
    'englishDefinition',
    'partOfSpeech',
    'ipa',
    'exampleSentence',
    'usageComment'
];

const HEADER_ALIASES = {
    word: 'wordText',
    words: 'wordText',
    phrase: 'wordText',
    wordtext: 'wordText',
    wordorphrase: 'wordText',
    nativeword: 'wordText',
    english: 'englishDefinition',
    meaning: 'englishDefinition',
    definition: 'englishDefinition',
    englishdefinition: 'englishDefinition',
    partofspeech: 'partOfSpeech',
    pos: 'partOfSpeech',
    ipa: 'ipa',
    pronunciation: 'ipa',
    pronunciationipa: 'ipa',
    examplesentence: 'exampleSentence',
    example: 'exampleSentence',
    sentence: 'exampleSentence',
    usagecomment: 'usageComment',
    usage: 'usageComment',
    note: 'usageComment',
    notes: 'usageComment'
};

function normalizeHeader(header) {
    return String(header || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

function normalizeValue(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
}

function normalizeDuplicateValue(value) {
    return normalizeValue(value).toLowerCase().replace(/\s+/g, ' ');
}

function duplicateKey({ wordText, englishDefinition, partOfSpeech }) {
    return [
        normalizeDuplicateValue(wordText),
        normalizeDuplicateValue(englishDefinition),
        normalizeDuplicateValue(partOfSpeech)
    ].join('|');
}

function mapRecord(record) {
    const mapped = {};

    Object.entries(record).forEach(([header, value]) => {
        const field = HEADER_ALIASES[normalizeHeader(header)];
        if (field && IMPORT_FIELDS.includes(field)) {
            mapped[field] = normalizeValue(value);
        }
    });

    IMPORT_FIELDS.forEach((field) => {
        if (!mapped[field]) mapped[field] = '';
    });

    return mapped;
}

function rowsToRecords(rows) {
    const headerRow = rows.find(row => row.some(cell => normalizeValue(cell)));
    if (!headerRow) return [];

    const headerIndex = rows.indexOf(headerRow);
    const headers = headerRow.map(cell => normalizeValue(cell));

    return rows.slice(headerIndex + 1)
        .filter(row => row.some(cell => normalizeValue(cell)))
        .map((row, index) => {
            const record = {};
            headers.forEach((header, columnIndex) => {
                record[header] = row[columnIndex];
            });
            return {
                rowNumber: headerIndex + index + 2,
                data: mapRecord(record)
            };
        });
}

function parseCsv(buffer) {
    const records = parse(buffer.toString('utf8'), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true
    });

    return records.map((record, index) => ({
        rowNumber: index + 2,
        data: mapRecord(record)
    }));
}

async function parseXlsx(buffer) {
    const rows = await readSheet(buffer);
    return rowsToRecords(rows);
}

async function parseImportFile(file) {
    if (!file) {
        const err = new Error('Import file is required');
        err.statusCode = 400;
        throw err;
    }

    const ext = path.extname(file.originalname).toLowerCase();

    if (ext === '.csv') return parseCsv(file.buffer);
    if (ext === '.xlsx') return parseXlsx(file.buffer);

    const err = new Error('Only CSV and XLSX files are supported');
    err.statusCode = 400;
    throw err;
}

async function getExistingDuplicateKeys(languageId) {
    const translations = await prisma.translation.findMany({
        where: { languageId },
        select: {
            wordText: true,
            englishDefinition: true,
            partOfSpeech: true
        }
    });

    return new Set(translations.map(duplicateKey));
}

function validateRow(data) {
    const missing = REQUIRED_FIELDS.filter(field => !data[field]);
    if (missing.length > 0) {
        return `Missing required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`;
    }

    return null;
}

async function createTranslationForRow({ userId, languageId, status, data }) {
    const commonWord = await findCommonWordMatch(data.englishDefinition);

    const isFirstCoverage = commonWord
        ? (await prisma.translation.count({ where: { languageId, commonWordId: commonWord.id } })) === 0
        : false;

    const translation = await prisma.translation.create({
        data: {
            authorId: userId,
            languageId,
            wordText: data.wordText,
            ipa: data.ipa || null,
            englishDefinition: data.englishDefinition,
            exampleSentence: data.exampleSentence || null,
            audioUrl: null,
            partOfSpeech: data.partOfSpeech || null,
            commonWordId: commonWord ? commonWord.id : null,
            usageComment: data.usageComment || null,
            status,
            publishedAt: status === 'VERIFIED' ? new Date() : null
        }
    });

    if (isFirstCoverage) {
        await prisma.language.update({
            where: { id: languageId },
            data: { completionCount: { increment: 1 } }
        });
    }

    return translation;
}

async function recalculateLanguageCompletionCount(languageId) {
    const coveredCommonWords = await prisma.translation.findMany({
        where: {
            languageId,
            commonWordId: { not: null }
        },
        select: { commonWordId: true },
        distinct: ['commonWordId']
    });

    await prisma.language.update({
        where: { id: languageId },
        data: { completionCount: coveredCommonWords.length }
    });
}

function serializeBatch(batch) {
    return {
        ...batch,
        rows: batch.rows?.map(row => ({
            ...row,
            translation: row.translation
                ? {
                    ...row.translation,
                    audioUrl: undefined
                }
                : row.translation
        }))
    };
}

async function createImportBatch(user, { languageId, rightsConfirmed, file }) {
    const language = await prisma.language.findUnique({
        where: { id: languageId },
        select: { id: true }
    });

    if (!language) {
        const err = new Error('Language not found');
        err.statusCode = 404;
        throw err;
    }

    if (!rightsConfirmed) {
        const err = new Error('You must confirm you have permission to contribute this data');
        err.statusCode = 400;
        throw err;
    }

    const parsedRows = await parseImportFile(file);
    const existingKeys = await getExistingDuplicateKeys(languageId);
    const seenKeys = new Set();
    const translationStatus = user.role === 'ADMIN' ? 'VERIFIED' : 'UNVERIFIED';
    const batchStatus = user.role === 'ADMIN' ? 'APPROVED' : 'PENDING_REVIEW';

    const batch = await prisma.importBatch.create({
        data: {
            fileName: file.originalname,
            languageId,
            uploadedById: user.id,
            reviewedById: user.role === 'ADMIN' ? user.id : null,
            status: batchStatus,
            rightsConfirmed: true,
            totalRows: parsedRows.length,
            reviewedAt: user.role === 'ADMIN' ? new Date() : null
        }
    });

    let importedRows = 0;
    let skippedRows = 0;

    for (const parsedRow of parsedRows) {
        const data = parsedRow.data;
        const validationError = validateRow(data);
        const key = duplicateKey(data);

        let rowStatus = 'IMPORTED';
        let errorMessage = null;
        let translationId = null;

        if (validationError) {
            rowStatus = 'INVALID';
            errorMessage = validationError;
            skippedRows += 1;
        } else if (existingKeys.has(key) || seenKeys.has(key)) {
            rowStatus = 'SKIPPED_DUPLICATE';
            errorMessage = 'Skipped because this language already has a matching word, definition, and part of speech';
            skippedRows += 1;
        } else {
            const translation = await createTranslationForRow({
                userId: user.id,
                languageId,
                status: translationStatus,
                data
            });
            translationId = translation.id;
            existingKeys.add(key);
            seenKeys.add(key);
            importedRows += 1;
        }

        await prisma.importBatchRow.create({
            data: {
                importBatchId: batch.id,
                rowNumber: parsedRow.rowNumber,
                wordText: data.wordText || null,
                englishDefinition: data.englishDefinition || null,
                ipa: data.ipa || null,
                exampleSentence: data.exampleSentence || null,
                partOfSpeech: data.partOfSpeech || null,
                usageComment: data.usageComment || null,
                status: rowStatus,
                errorMessage,
                translationId
            }
        });
    }

    await prisma.importBatch.update({
        where: { id: batch.id },
        data: {
            importedRows,
            skippedRows
        }
    });

    return getImportBatch(batch.id, user);
}

async function getUserImportBatches(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { uploadedById: userId };

    const [batches, total] = await Promise.all([
        prisma.importBatch.findMany({
            where,
            include: {
                language: true
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.importBatch.count({ where })
    ]);

    return {
        batches,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

async function getAdminImportBatches({ page = 1, limit = 20, status, languageId } = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (languageId) where.languageId = languageId;

    const [batches, total] = await Promise.all([
        prisma.importBatch.findMany({
            where,
            include: {
                language: true,
                uploadedBy: { select: { id: true, username: true, email: true } },
                reviewedBy: { select: { id: true, username: true, email: true } }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.importBatch.count({ where })
    ]);

    return {
        batches,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

async function getImportBatch(batchId, user) {
    const batch = await prisma.importBatch.findUnique({
        where: { id: batchId },
        include: {
            language: true,
            uploadedBy: { select: { id: true, username: true, email: true } },
            reviewedBy: { select: { id: true, username: true, email: true } },
            rows: {
                include: {
                    translation: {
                        include: {
                            author: { select: { id: true, username: true } }
                        }
                    }
                },
                orderBy: { rowNumber: 'asc' }
            }
        }
    });

    if (!batch) {
        const err = new Error('Import batch not found');
        err.statusCode = 404;
        throw err;
    }

    if (user.role !== 'ADMIN' && batch.uploadedById !== user.id) {
        const err = new Error('You do not have permission to view this import batch');
        err.statusCode = 403;
        throw err;
    }

    return serializeBatch(batch);
}

async function approveImportBatch(batchId, adminId) {
    const batch = await prisma.importBatch.findUnique({
        where: { id: batchId },
        include: { rows: true }
    });

    if (!batch) throw new Error('Import batch not found');
    if (batch.status !== 'PENDING_REVIEW') throw new Error('Only pending batches can be approved');

    const translationIds = batch.rows
        .filter(row => row.translationId && row.status === 'IMPORTED')
        .map(row => row.translationId);

    await prisma.$transaction([
        prisma.translation.updateMany({
            where: { id: { in: translationIds } },
            data: { status: 'VERIFIED', publishedAt: new Date() }
        }),
        prisma.importBatch.update({
            where: { id: batchId },
            data: {
                status: 'APPROVED',
                reviewedById: adminId,
                reviewedAt: new Date()
            }
        })
    ]);

    return getImportBatch(batchId, { id: adminId, role: 'ADMIN' });
}

async function rejectImportBatch(batchId, adminId) {
    const batch = await prisma.importBatch.findUnique({
        where: { id: batchId },
        include: { rows: true }
    });

    if (!batch) throw new Error('Import batch not found');
    if (batch.status !== 'PENDING_REVIEW') throw new Error('Only pending batches can be rejected');

    const translationIds = batch.rows
        .filter(row => row.translationId && row.status === 'IMPORTED')
        .map(row => row.translationId);

    await prisma.$transaction([
        prisma.importBatchRow.updateMany({
            where: { importBatchId: batchId, translationId: { in: translationIds } },
            data: { status: 'REJECTED' }
        }),
        prisma.translation.deleteMany({
            where: { id: { in: translationIds } }
        }),
        prisma.importBatch.update({
            where: { id: batchId },
            data: {
                status: 'REJECTED',
                rejectedRows: translationIds.length,
                reviewedById: adminId,
                reviewedAt: new Date()
            }
        })
    ]);

    await recalculateLanguageCompletionCount(batch.languageId);

    return getImportBatch(batchId, { id: adminId, role: 'ADMIN' });
}

async function rollbackImportBatch(batchId, adminId) {
    const batch = await prisma.importBatch.findUnique({
        where: { id: batchId },
        include: { rows: true }
    });

    if (!batch) throw new Error('Import batch not found');
    if (batch.status !== 'APPROVED') throw new Error('Only approved batches can be rolled back');

    const translationIds = batch.rows
        .filter(row => row.translationId && row.status === 'IMPORTED')
        .map(row => row.translationId);

    await prisma.$transaction([
        prisma.importBatchRow.updateMany({
            where: { importBatchId: batchId, translationId: { in: translationIds } },
            data: { status: 'ROLLED_BACK' }
        }),
        prisma.translation.deleteMany({
            where: { id: { in: translationIds } }
        }),
        prisma.importBatch.update({
            where: { id: batchId },
            data: {
                status: 'ROLLED_BACK',
                reviewedById: adminId,
                reviewedAt: new Date()
            }
        })
    ]);

    await recalculateLanguageCompletionCount(batch.languageId);

    return getImportBatch(batchId, { id: adminId, role: 'ADMIN' });
}

const importBatchService = {
    createImportBatch,
    getUserImportBatches,
    getAdminImportBatches,
    getImportBatch,
    approveImportBatch,
    rejectImportBatch,
    rollbackImportBatch
};

export default importBatchService;
