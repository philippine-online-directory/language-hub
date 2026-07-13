import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { importBatchService } from '../../api/importBatchService';
import { languageService } from '../../api/languageService';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import MissingWordsBottomSheet from '../../components/MissingWordsSidebar/MissingWordsBottomSheet';
import MissingWordsSidebar from '../../components/MissingWordsSidebar/MissingWordsSidebar';
import styles from './BulkUploadPage.module.css';

const TEMPLATE_HEADERS = [
    'wordText',
    'englishDefinition',
    'partOfSpeech',
    'exampleSentence',
    'usageComment'
];

const FIELD_LABELS = {
    wordText: 'Word',
    englishDefinition: 'English definition',
    partOfSpeech: 'Part of speech',
    exampleSentence: 'Example sentence',
    usageComment: 'Usage note'
};

const SAMPLE_ROWS = [
    ['bahay', 'house', 'noun', 'Malaki ang bahay namin.', 'Use for a house or home where someone lives.'],
    ['tubig', 'water', '', '', '']
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
    examplesentence: 'exampleSentence',
    example: 'exampleSentence',
    sentence: 'exampleSentence',
    usagecomment: 'usageComment',
    usage: 'usageComment',
    note: 'usageComment',
    notes: 'usageComment'
};

const UPLOAD_PROGRESS_LABELS = [
    'Uploading file...',
    'Sending to server...',
    'Processing rows...',
    'Checking duplicates...'
];

const GUIDE_BY_INPUT_MODE = {
    file: {
        title: 'How to Build Your File',
        steps: [
            'Download one of the templates or upload your own spreadsheet.',
            'Inside the template, there are 2 valid translation rows/examples: one where both the required and optional fields are filled out, and one where only the required fields are filled out. Use it as a guide to add translations and rows to the template.',
            'Choose one language for the whole upload.',
            'Keep one translation per row. Headers can use names like word, meaning, example, or notes.',
            'Upload CSV/XLSX from your computer. Old XLS files are not supported.',
            'Review the result for imported, duplicate, or invalid rows.'
        ]
    },
    table: {
        title: 'How to Use the Blank Table',
        steps: [
            'Choose the language these words belong to.',
            'Use the 10 blank rows already shown, or reset the table when you want to start over.',
            'Type one word or phrase on each row.',
            'Fill in Word and English definition for every row you want to upload.',
            'Add part of speech, example sentence, or usage note only if you have them.',
            'Click Add Row if you need more space. Click Remove for any row you do not want.',
            'Valid rows/translations are signaled by a green checkmark next to the row number.',
            'Confirm that you have permission to contribute the data, then submit.'
        ]
    }
};

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
        value = value & 1 ? (0xEDB88320 ^ (value >>> 1)) : value >>> 1;
    }
    return value >>> 0;
});

function escapeXml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function columnName(index) {
    let name = '';
    let current = index + 1;
    while (current > 0) {
        const remainder = (current - 1) % 26;
        name = String.fromCharCode(65 + remainder) + name;
        current = Math.floor((current - 1) / 26);
    }
    return name;
}

function createWorksheetXml(rows) {
    const sheetData = rows.map((row, rowIndex) => {
        const rowNumber = rowIndex + 1;
        const cells = row.map((cell, columnIndex) => {
            const ref = `${columnName(columnIndex)}${rowNumber}`;
            return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`;
        }).join('');
        return `<row r="${rowNumber}">${cells}</row>`;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetData}</sheetData></worksheet>`;
}

function stringToBytes(value) {
    return new TextEncoder().encode(value);
}

function uint16(value) {
    const bytes = new Uint8Array(2);
    new DataView(bytes.buffer).setUint16(0, value, true);
    return bytes;
}

function uint32(value) {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value, true);
    return bytes;
}

function concatBytes(chunks) {
    const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
    const result = new Uint8Array(length);
    let offset = 0;
    chunks.forEach((chunk) => {
        result.set(chunk, offset);
        offset += chunk.length;
    });
    return result;
}

function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    bytes.forEach((byte) => {
        crc = CRC_TABLE[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
    });
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createZip(files) {
    const localFiles = [];
    const centralDirectory = [];
    let offset = 0;

    files.forEach(({ path, content }) => {
        const nameBytes = stringToBytes(path);
        const contentBytes = stringToBytes(content);
        const checksum = crc32(contentBytes);
        const localHeader = concatBytes([
            uint32(0x04034B50),
            uint16(20),
            uint16(0),
            uint16(0),
            uint16(0),
            uint16(0),
            uint32(checksum),
            uint32(contentBytes.length),
            uint32(contentBytes.length),
            uint16(nameBytes.length),
            uint16(0),
            nameBytes
        ]);
        const centralHeader = concatBytes([
            uint32(0x02014B50),
            uint16(20),
            uint16(20),
            uint16(0),
            uint16(0),
            uint16(0),
            uint16(0),
            uint32(checksum),
            uint32(contentBytes.length),
            uint32(contentBytes.length),
            uint16(nameBytes.length),
            uint16(0),
            uint16(0),
            uint16(0),
            uint16(0),
            uint32(0),
            uint32(offset),
            nameBytes
        ]);

        localFiles.push(localHeader, contentBytes);
        centralDirectory.push(centralHeader);
        offset += localHeader.length + contentBytes.length;
    });

    const centralDirectoryBytes = concatBytes(centralDirectory);
    const endRecord = concatBytes([
        uint32(0x06054B50),
        uint16(0),
        uint16(0),
        uint16(files.length),
        uint16(files.length),
        uint32(centralDirectoryBytes.length),
        uint32(offset),
        uint16(0)
    ]);

    return concatBytes([...localFiles, centralDirectoryBytes, endRecord]);
}

function createXlsxBlob(rows) {
    const files = [
        {
            path: '[Content_Types].xml',
            content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`
        },
        {
            path: '_rels/.rels',
            content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`
        },
        {
            path: 'xl/workbook.xml',
            content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Bulk Upload Template" sheetId="1" r:id="rId1"/></sheets></workbook>`
        },
        {
            path: 'xl/_rels/workbook.xml.rels',
            content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`
        },
        {
            path: 'xl/worksheets/sheet1.xml',
            content: createWorksheetXml(rows)
        }
    ];

    return new Blob([createZip(files)], { type: XLSX_MIME_TYPE });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function downloadCsvTemplate() {
    const rows = [TEMPLATE_HEADERS, ...SAMPLE_ROWS];
    const csv = rows
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, 'bulk-translation-template.csv');
}

function downloadXlsxTemplate() {
    const rows = [TEMPLATE_HEADERS, ...SAMPLE_ROWS];
    downloadBlob(createXlsxBlob(rows), 'bulk-translation-template.xlsx');
}

function normalizeHeader(header) {
    return String(header || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

function emptyRowData() {
    return TEMPLATE_HEADERS.reduce((acc, field) => {
        acc[field] = '';
        return acc;
    }, {});
}

function inferColumnMapping(headers) {
    const mapping = emptyRowData();

    TEMPLATE_HEADERS.forEach((field) => {
        mapping[field] = '';
    });

    headers.forEach((header, index) => {
        const field = HEADER_ALIASES[normalizeHeader(header)];
        if (field && !mapping[field]) {
            mapping[field] = String(index);
        }
    });

    return mapping;
}

function sourceRowsToDraftRows(sourceRows, mapping) {
    return sourceRows.map((sourceRow, index) => {
        const data = emptyRowData();

        TEMPLATE_HEADERS.forEach((field) => {
            const sourceIndex = mapping[field];
            data[field] = sourceIndex === '' ? '' : String(sourceRow.values[Number(sourceIndex)] || '').trim();
        });

        return {
            id: `${sourceRow.rowNumber}-${index}`,
            rowNumber: sourceRow.rowNumber,
            data
        };
    });
}

function csvEscape(value) {
    return `"${String(value || '').replace(/"/g, '""')}"`;
}

function createCsvFileFromRows(rows) {
    const csv = [
        TEMPLATE_HEADERS.map(csvEscape).join(','),
        ...rows.map(row => TEMPLATE_HEADERS.map(field => csvEscape(row.data[field])).join(','))
    ].join('\n');

    return new File([csv], 'reviewed-translations.csv', { type: 'text/csv;charset=utf-8;' });
}

function formatStatus(status) {
    return status.replace(/_/g, ' ').toLowerCase();
}

function getDraftRowIssue(row) {
    const missing = [];
    if (!row.data.wordText) missing.push('word');
    if (!row.data.englishDefinition) missing.push('English definition');
    if (missing.length === 0) return '';
    return `Missing ${missing.join(' and ')}`;
}

function createBlankDraftRows(count = 10) {
    return Array.from({ length: count }, (_, index) => ({
        id: `blank-${index + 1}`,
        rowNumber: index + 1,
        data: emptyRowData()
    }));
}

export default function BulkUploadPage() {
    const [languages, setLanguages] = useState([]);
    const [languageId, setLanguageId] = useState('');
    const [inputMode, setInputMode] = useState('table');
    const [file, setFile] = useState(null);
    const [sourcePreview, setSourcePreview] = useState(null);
    const [columnMapping, setColumnMapping] = useState(inferColumnMapping([]));
    const [draftRows, setDraftRows] = useState(() => createBlankDraftRows());
    const [rightsConfirmed, setRightsConfirmed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadProgressLabelIndex, setUploadProgressLabelIndex] = useState(0);
    const [languagesLoading, setLanguagesLoading] = useState(true);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [guideModalOpen, setGuideModalOpen] = useState(false);
    const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

    const nonEmptyDraftRows = useMemo(
        () => draftRows.filter(row => TEMPLATE_HEADERS.some(field => row.data[field])),
        [draftRows]
    );
    const rowsNeedingReview = useMemo(
        () => draftRows.filter(row => getDraftRowIssue(row)).length,
        [draftRows]
    );
    const selectedGuide = GUIDE_BY_INPUT_MODE[inputMode];
    const selectedSlug = languages.find(language => language.id === languageId)?.slug ?? null;

    useEffect(() => {
        const loadInitialData = async () => {
            setLanguagesLoading(true);
            try {
                const languageResult = await languageService.getLanguages(1, 1000);
                const loadedLanguages = languageResult.languages || [];
                setLanguages(loadedLanguages);
                if (loadedLanguages.length > 0) setLanguageId(loadedLanguages[0].id);
            } catch (err) {
                console.error('Failed to load bulk upload data:', err);
                setError('Failed to load bulk upload data. Please refresh the page.');
            } finally {
                setLanguagesLoading(false);
            }
        };

        loadInitialData();
    }, []);

    useEffect(() => {
        if (!loading) return undefined;

        const intervalId = setInterval(() => {
            setUploadProgress(prev => {
                if (prev < 35) return prev + 7;
                if (prev < 70) return prev + 4;
                if (prev < 90) return prev + 2;
                return Math.min(prev + 1, 92);
            });
            setUploadProgressLabelIndex(prev => (prev + 1) % UPLOAD_PROGRESS_LABELS.length);
        }, 900);

        return () => clearInterval(intervalId);
    }, [loading]);

    const resetReview = () => {
        setSourcePreview(null);
        setColumnMapping(inferColumnMapping([]));
        setDraftRows([]);
    };

    const startReview = (preview) => {
        if (preview.rows.length === 0) {
            setError('No data rows were found to review.');
            return;
        }

        const mapping = preview.suggestedMapping || inferColumnMapping(preview.headers);
        setSourcePreview(preview);
        setColumnMapping(mapping);
        setDraftRows(sourceRowsToDraftRows(preview.rows, mapping));
        setError('');
        setResult(null);
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        setResult(null);
        setError('');
        resetReview();

        if (!selected) {
            setFile(null);
            return;
        }

        const name = selected.name.toLowerCase();
        if (!name.endsWith('.csv') && !name.endsWith('.xlsx')) {
            setError('Upload a CSV or XLSX file. Legacy XLS files are not supported.');
            setFile(null);
            e.target.value = '';
            return;
        }

        setFile(selected);
    };

    const handleInputModeChange = (mode) => {
        setInputMode(mode);
        setError('');
        setResult(null);
        if (mode === 'table') {
            setSourcePreview(null);
            setColumnMapping(inferColumnMapping([]));
            setDraftRows(createBlankDraftRows());
        } else {
            resetReview();
        }
    };

    const handlePreviewFile = async () => {
        setError('');
        setResult(null);

        if (!file) {
            setError('Choose a CSV or XLSX file to review.');
            return;
        }

        setPreviewLoading(true);
        try {
            const preview = await importBatchService.previewImportFile({ file });
            startReview(preview);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to preview import file.');
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleStartBlankTable = () => {
        setError('');
        setResult(null);
        setSourcePreview(null);
        setColumnMapping(inferColumnMapping([]));
        setDraftRows(createBlankDraftRows());
    };

    const handleColumnMappingChange = (field, sourceIndex) => {
        const nextMapping = {
            ...columnMapping,
            [field]: sourceIndex
        };
        setColumnMapping(nextMapping);
        if (sourcePreview) {
            setDraftRows(sourceRowsToDraftRows(sourcePreview.rows, nextMapping));
        }
    };

    const handleDraftCellChange = (rowId, field, value) => {
        setDraftRows(prev => prev.map(row => (
            row.id === rowId
                ? { ...row, data: { ...row.data, [field]: value } }
                : row
        )));
    };

    const handleAddDraftRow = () => {
        setDraftRows(prev => [
            ...prev,
            {
                id: `manual-${Date.now()}-${prev.length + 1}`,
                rowNumber: prev.length + 1,
                data: emptyRowData()
            }
        ]);
    };

    const handleMissingWordClick = (word) => {
        setInputMode('table');
        setError('');
        setResult(null);
        setSourcePreview(null);
        setColumnMapping(inferColumnMapping([]));
        setMobileSheetOpen(false);
        setDraftRows(prev => {
            const rows = prev.length > 0 ? prev : createBlankDraftRows();
            const emptyDefinitionIndex = rows.findIndex(row => !row.data.englishDefinition.trim());

            if (emptyDefinitionIndex >= 0) {
                return rows.map((row, index) => (
                    index === emptyDefinitionIndex
                        ? { ...row, data: { ...row.data, englishDefinition: word.word } }
                        : row
                ));
            }

            return [
                ...rows,
                {
                    id: `manual-${Date.now()}-${rows.length + 1}`,
                    rowNumber: rows.length + 1,
                    data: { ...emptyRowData(), englishDefinition: word.word }
                }
            ];
        });
    };

    const handleDeleteDraftRow = (rowId) => {
        setDraftRows(prev => prev
            .filter(row => row.id !== rowId)
            .map((row, index) => ({ ...row, rowNumber: index + 1 })));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setResult(null);

        if (!languageId) {
            setError('Choose the language this file belongs to.');
            return;
        }

        if (nonEmptyDraftRows.length === 0) {
            setError('Review at least one row before uploading.');
            return;
        }

        if (!nonEmptyDraftRows.some(row => !getDraftRowIssue(row))) {
            setError('At least one reviewed row needs both a word and an English definition.');
            return;
        }

        if (!rightsConfirmed) {
            setError('Confirm that you have permission to contribute this data.');
            return;
        }

        setLoading(true);
        setUploadProgress(8);
        setUploadProgressLabelIndex(0);
        try {
            const uploadFile = createCsvFileFromRows(nonEmptyDraftRows);
            const batch = await importBatchService.createImportBatch({
                languageId,
                file: uploadFile,
                rightsConfirmed
            });
            setResult(batch);
            setFile(null);
            resetReview();
            setRightsConfirmed(false);
            e.target.reset();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload import file.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.bulkUploadPage}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Bulk Upload Translations</h1>
                        <p className={styles.subtitle}>
                            For institutions, websites, and teams bringing many text entries into one language.
                        </p>
                    </div>
                    <Link to="/contribute" className={styles.singleLink}>Add one word instead</Link>
                </header>

                {inputMode === 'table' && selectedSlug && (
                    <button
                        type="button"
                        className={styles.mobileSheetBtn}
                        onClick={() => setMobileSheetOpen(true)}
                        aria-haspopup="dialog"
                    >
                        View Missing Words
                    </button>
                )}

                <div className={styles.layout}>
                    <section className={styles.mainColumn}>
                        <Card className={styles.uploadCard}>
                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="languageId" className={styles.label}>Language</label>
                                    {languagesLoading ? (
                                        <div className={styles.loadingBox}>Loading languages...</div>
                                    ) : (
                                        <select
                                            id="languageId"
                                            value={languageId}
                                            onChange={(e) => setLanguageId(e.target.value)}
                                            className={styles.select}
                                        >
                                            {languages.map(language => (
                                                <option key={language.id} value={language.id}>
                                                    {language.name}{language.isoCode ? ` (${language.isoCode.toUpperCase()})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div className={styles.formGroup}>
                                    <span className={styles.label}>Bulk entry method</span>
                                    <div className={styles.modeSwitch} role="radiogroup" aria-label="Bulk entry method">
                                        <label className={`${styles.modeOption} ${inputMode === 'file' ? styles.activeMode : ''}`}>
                                            <input
                                                type="radio"
                                                name="inputMode"
                                                value="file"
                                                checked={inputMode === 'file'}
                                                onChange={() => handleInputModeChange('file')}
                                            />
                                            <span>Upload a file</span>
                                        </label>
                                        <label className={`${styles.modeOption} ${inputMode === 'table' ? styles.activeMode : ''}`}>
                                            <input
                                                type="radio"
                                                name="inputMode"
                                                value="table"
                                                checked={inputMode === 'table'}
                                                onChange={() => handleInputModeChange('table')}
                                            />
                                            <span>Use table editor</span>
                                        </label>
                                    </div>
                                </div>

                                {inputMode === 'file' ? (
                                    <div className={styles.formGroup}>
                                        <label htmlFor="file" className={styles.label}>CSV or XLSX file</label>
                                        <div className={styles.uploadSection}>
                                            <input
                                                id="file"
                                                type="file"
                                                accept=".csv,.xlsx"
                                                onChange={handleFileChange}
                                                className={styles.fileInput}
                                            />
                                            {file && (
                                                <div className={styles.fileInfo}>
                                                    <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFile(null);
                                                            resetReview();
                                                            const fileInput = document.getElementById('file');
                                                            if (fileInput) fileInput.value = '';
                                                        }}
                                                        className={styles.deleteButton}
                                                        aria-label="Remove file"
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                                                            <line x1="18" y1="6" x2="6" y2="18" />
                                                            <line x1="6" y1="6" x2="18" y2="18" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                            <p className={styles.hint}>CSV or XLSX only. Legacy XLS files are not supported.</p>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={handlePreviewFile}
                                                disabled={!file || previewLoading}
                                                loading={previewLoading}
                                            >
                                                Review File
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.formGroup}>
                                        <span className={styles.label}>Blank table editor</span>
                                        <p className={styles.hint}>
                                            Start with empty rows, then fill only the fields you have. Word and English definition are required.
                                        </p>
                                        <div className={styles.tableIntroActions}>
                                            <Button type="button" variant="secondary" onClick={handleStartBlankTable}>
                                                Reset to 10 Blank Rows
                                            </Button>
                                            <Button type="button" variant="secondary" onClick={() => setGuideModalOpen(true)}>
                                                How to Use the Table
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {draftRows.length > 0 && (
                                    <div className={styles.reviewPanel}>
                                        <div className={styles.previewHeader}>
                                            <span>{sourcePreview?.fileName || 'Reviewed rows'}</span>
                                            <span>
                                                {nonEmptyDraftRows.length} row{nonEmptyDraftRows.length === 1 ? '' : 's'} ready,
                                                {' '}{rowsNeedingReview} need review
                                            </span>
                                        </div>

                                        {sourcePreview?.headers?.length > 0 && (
                                            <div className={styles.mappingGrid}>
                                                {TEMPLATE_HEADERS.map(field => (
                                                    <label key={field} className={styles.mappingField}>
                                                        <span>
                                                            {FIELD_LABELS[field]}
                                                            {(field === 'wordText' || field === 'englishDefinition') && (
                                                                <span className={styles.requiredMark} aria-label="required"> *</span>
                                                            )}
                                                        </span>
                                                        <select
                                                            value={columnMapping[field] ?? ''}
                                                            onChange={(e) => handleColumnMappingChange(field, e.target.value)}
                                                            className={styles.mappingSelect}
                                                        >
                                                            <option value="">Do not import</option>
                                                            {sourcePreview.headers.map((header, index) => (
                                                                <option key={`${header}-${index}`} value={String(index)}>
                                                                    {header}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        <div className={styles.tableWrap}>
                                            <table className={`${styles.table} ${styles.editorTable}`}>
                                                <thead>
                                                    <tr>
                                                        <th>Row</th>
                                                        <th>Word <span className={styles.requiredMark} aria-label="required">*</span></th>
                                                        <th>English definition <span className={styles.requiredMark} aria-label="required">*</span></th>
                                                        <th>Part of speech</th>
                                                        <th>Example sentence</th>
                                                        <th>Usage note</th>
                                                        <th>Status</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {draftRows.map(row => {
                                                        const issue = getDraftRowIssue(row);
                                                        return (
                                                            <tr key={row.id}>
                                                                <td className={styles.rowNumberCell}>
                                                                    <span>{row.rowNumber}</span>
                                                                    {!issue && (
                                                                        <span className={styles.validIcon} aria-label={`Row ${row.rowNumber} is valid`}>
                                                                            <svg viewBox="0 0 20 20" aria-hidden="true">
                                                                                <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 0 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0z" />
                                                                            </svg>
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                {TEMPLATE_HEADERS.map(field => (
                                                                    <td key={field}>
                                                                        <input
                                                                            type="text"
                                                                            value={row.data[field]}
                                                                            onChange={(e) => handleDraftCellChange(row.id, field, e.target.value)}
                                                                            className={styles.cellInput}
                                                                            aria-label={`${FIELD_LABELS[field]} for row ${row.rowNumber}`}
                                                                        />
                                                                    </td>
                                                                ))}
                                                                <td>{issue}</td>
                                                                <td>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteDraftRow(row.id)}
                                                                        className={styles.rowAction}
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className={styles.reviewActions}>
                                            <Button type="button" variant="secondary" onClick={handleAddDraftRow}>
                                                Add Row
                                            </Button>
                                            <Button type="button" variant="secondary" onClick={resetReview}>
                                                Clear Review
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <label className={styles.checkboxRow}>
                                    <input
                                        type="checkbox"
                                        checked={rightsConfirmed}
                                        onChange={(e) => setRightsConfirmed(e.target.checked)}
                                    />
                                    <span>I confirm that I have permission to contribute this data.</span>
                                </label>

                                {error && <div className={styles.error}>{error}</div>}

                                <div className={styles.actions}>
                                    <Button type="submit" disabled={languagesLoading || loading}>
                                        Submit Reviewed Rows
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={downloadCsvTemplate}>
                                        Download CSV Template
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={downloadXlsxTemplate}>
                                        Download XLSX Template
                                    </Button>
                                </div>

                                {loading && (
                                    <div className={styles.progressStatus} role="status" aria-live="polite">
                                        <div className={styles.progressHeader}>
                                            <span>{UPLOAD_PROGRESS_LABELS[uploadProgressLabelIndex]}</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div
                                            className={styles.progressTrack}
                                            role="progressbar"
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                            aria-valuenow={uploadProgress}
                                        >
                                            <div
                                                className={styles.progressFill}
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </form>
                        </Card>

                        {result && (
                            <Card className={styles.resultCard}>
                                <h2 className={styles.sectionTitle}>Upload Result</h2>
                                <div className={styles.summaryGrid}>
                                    <SummaryItem label="Batch status" value={formatStatus(result.status)} />
                                    <SummaryItem label="Total rows" value={result.totalRows} />
                                    <SummaryItem label="Imported" value={result.importedRows} />
                                    <SummaryItem label="Skipped" value={result.skippedRows} />
                                </div>

                                <div className={styles.tableWrap}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Row</th>
                                                <th>Word</th>
                                                <th>English definition</th>
                                                <th>Part of speech</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.rows?.slice(0, 25).map(row => (
                                                <tr key={row.id}>
                                                    <td>{row.rowNumber}</td>
                                                    <td>{row.wordText || '-'}</td>
                                                    <td>{row.englishDefinition || '-'}</td>
                                                    <td>{row.partOfSpeech || '-'}</td>
                                                    <td>
                                                        <span className={`${styles.badge} ${styles[row.status]}`}>
                                                            {formatStatus(row.status)}
                                                        </span>
                                                        {row.errorMessage && <p className={styles.rowError}>{row.errorMessage}</p>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}
                    </section>

                    <aside className={`${styles.guideColumn} ${inputMode === 'table' ? styles.missingWordsColumn : ''}`}>
                        {inputMode === 'table' ? (
                            <MissingWordsSidebar
                                slug={selectedSlug}
                                onWordClick={handleMissingWordClick}
                                clickHint="Add to table"
                            />
                        ) : (
                            <GuideContent selectedGuide={selectedGuide} />
                        )}
                    </aside>
                </div>
            </div>

            <MissingWordsBottomSheet
                isOpen={mobileSheetOpen}
                onClose={() => setMobileSheetOpen(false)}
                slug={selectedSlug}
                onWordClick={handleMissingWordClick}
            />

            {guideModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setGuideModalOpen(false)}>
                    <Card
                        className={styles.modal}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="bulk-table-guide-title"
                        onClick={(e) => e.stopPropagation()}
                        asDiv
                    >
                        <div className={styles.modalHeader}>
                            <h2 id="bulk-table-guide-title" className={styles.sectionTitle}>{selectedGuide.title}</h2>
                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={() => setGuideModalOpen(false)}
                                aria-label="Close guide"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <GuideDetails selectedGuide={selectedGuide} />
                    </Card>
                </div>
            )}
        </div>
    );
}

function GuideContent({ selectedGuide }) {
    return (
        <Card className={styles.guideCard}>
            <h2 className={styles.sectionTitle}>{selectedGuide.title}</h2>
            <GuideDetails selectedGuide={selectedGuide} />
        </Card>
    );
}

function GuideDetails({ selectedGuide }) {
    return (
        <>
            <ol className={styles.steps}>
                {selectedGuide.steps.map(step => (
                    <li key={step}>{step}</li>
                ))}
            </ol>

            <div className={styles.fields}>
                <h3 className={styles.requiredHeading}>Required fields</h3>
                <p><code>wordText</code> - word or phrase in the language.</p>
                <p><code>englishDefinition</code> - English meaning.</p>

                <h3 className={styles.optionalHeading}>Optional fields</h3>
                <p><code>partOfSpeech</code> - noun, verb, phrase, etc.</p>
                <p><code>exampleSentence</code> - sentence using the word.</p>
                <p><code>usageComment</code> - note on how the word might be used.</p>
            </div>
        </>
    );
}

function SummaryItem({ label, value }) {
    return (
        <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{value}</span>
            <span className={styles.summaryLabel}>{label}</span>
        </div>
    );
}
