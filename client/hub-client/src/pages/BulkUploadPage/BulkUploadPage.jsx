import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { importBatchService } from '../../api/importBatchService';
import { languageService } from '../../api/languageService';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import styles from './BulkUploadPage.module.css';

const TEMPLATE_HEADERS = [
    'wordText',
    'englishDefinition',
    'partOfSpeech',
    'exampleSentence',
    'usageComment'
];

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

function parseDelimitedLine(line, separator) {
    const cells = [];
    let cell = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const nextChar = line[index + 1];

        if (char === '"' && inQuotes && nextChar === '"') {
            cell += '"';
            index += 1;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === separator && !inQuotes) {
            cells.push(cell.trim());
            cell = '';
        } else {
            cell += char;
        }
    }

    cells.push(cell.trim());
    return cells;
}

function parsePastedRows(value) {
    const lines = value
        .split(/\r\n|\n|\r/)
        .filter(line => line.trim());

    if (lines.length === 0) return [];

    const rawRows = lines.map((line) => {
        const separator = line.includes('\t') ? '\t' : ',';
        return parseDelimitedLine(line, separator);
    });

    const headerFields = rawRows[0].map(header => HEADER_ALIASES[normalizeHeader(header)]);
    const hasHeader = headerFields.filter(Boolean).length >= 2;
    const fields = hasHeader ? headerFields : TEMPLATE_HEADERS;
    const rows = hasHeader ? rawRows.slice(1) : rawRows;
    const firstRowNumber = hasHeader ? 2 : 1;

    return rows
        .map((row, index) => {
            const data = TEMPLATE_HEADERS.reduce((acc, field) => ({ ...acc, [field]: '' }), {});

            row.forEach((cell, columnIndex) => {
                const field = fields[columnIndex];
                if (field && TEMPLATE_HEADERS.includes(field)) {
                    data[field] = cell.trim();
                }
            });

            return {
                rowNumber: firstRowNumber + index,
                data
            };
        })
        .filter(row => TEMPLATE_HEADERS.some(field => row.data[field]));
}

function csvEscape(value) {
    return `"${String(value || '').replace(/"/g, '""')}"`;
}

function createCsvFileFromRows(rows) {
    const csv = [
        TEMPLATE_HEADERS.map(csvEscape).join(','),
        ...rows.map(row => TEMPLATE_HEADERS.map(field => csvEscape(row.data[field])).join(','))
    ].join('\n');

    return new File([csv], 'pasted-translations.csv', { type: 'text/csv;charset=utf-8;' });
}

function formatStatus(status) {
    return status.replace(/_/g, ' ').toLowerCase();
}

function getPastedRowIssue(row) {
    const missing = [];
    if (!row.data.wordText) missing.push('word');
    if (!row.data.englishDefinition) missing.push('English definition');
    if (missing.length === 0) return '';
    return `Missing ${missing.join(' and ')}`;
}

export default function BulkUploadPage() {
    const [languages, setLanguages] = useState([]);
    const [languageId, setLanguageId] = useState('');
    const [inputMode, setInputMode] = useState('file');
    const [file, setFile] = useState(null);
    const [pastedRowsText, setPastedRowsText] = useState('');
    const [rightsConfirmed, setRightsConfirmed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadProgressLabelIndex, setUploadProgressLabelIndex] = useState(0);
    const [languagesLoading, setLanguagesLoading] = useState(true);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [recentBatches, setRecentBatches] = useState([]);

    const pastedRows = useMemo(() => parsePastedRows(pastedRowsText), [pastedRowsText]);

    useEffect(() => {
        const loadInitialData = async () => {
            setLanguagesLoading(true);
            try {
                const [languageResult, batchResult] = await Promise.all([
                    languageService.getLanguages(1, 1000),
                    importBatchService.getMyImportBatches(1, 5)
                ]);
                const loadedLanguages = languageResult.languages || [];
                setLanguages(loadedLanguages);
                if (loadedLanguages.length > 0) setLanguageId(loadedLanguages[0].id);
                setRecentBatches(batchResult.batches || []);
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

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        setResult(null);
        setError('');

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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setResult(null);

        if (!languageId) {
            setError('Choose the language this file belongs to.');
            return;
        }

        if (inputMode === 'file' && !file) {
            setError('Choose a CSV or XLSX file to upload.');
            return;
        }

        if (inputMode === 'paste') {
            if (pastedRows.length === 0) {
                setError('Paste at least one row to upload.');
                return;
            }

            if (!pastedRows.some(row => !getPastedRowIssue(row))) {
                setError('Paste at least one row with both a word and an English definition.');
                return;
            }
        }

        if (!rightsConfirmed) {
            setError('Confirm that you have permission to contribute this data.');
            return;
        }

        setLoading(true);
        setUploadProgress(8);
        setUploadProgressLabelIndex(0);
        try {
            const uploadFile = inputMode === 'file' ? file : createCsvFileFromRows(pastedRows);
            const batch = await importBatchService.createImportBatch({
                languageId,
                file: uploadFile,
                rightsConfirmed
            });
            setResult(batch);
            setRecentBatches(prev => [batch, ...prev].slice(0, 5));
            setFile(null);
            if (inputMode === 'paste') setPastedRowsText('');
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
                                            <span>Upload CSV/XLSX</span>
                                        </label>
                                        <label className={`${styles.modeOption} ${inputMode === 'paste' ? styles.activeMode : ''}`}>
                                            <input
                                                type="radio"
                                                name="inputMode"
                                                value="paste"
                                                checked={inputMode === 'paste'}
                                                onChange={() => handleInputModeChange('paste')}
                                            />
                                            <span>Paste spreadsheet rows</span>
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
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.formGroup}>
                                        <label htmlFor="pastedRows" className={styles.label}>Paste rows from a spreadsheet</label>
                                        <textarea
                                            id="pastedRows"
                                            value={pastedRowsText}
                                            onChange={(e) => {
                                                setPastedRowsText(e.target.value);
                                                setResult(null);
                                                setError('');
                                            }}
                                            className={styles.textarea}
                                            rows={8}
                                            placeholder={`wordText\tenglishDefinition\tpartOfSpeech\texampleSentence\tusageComment\nbahay\thouse\tnoun\tMalaki ang bahay namin.\tUse for a house or home where someone lives.`}
                                        />
                                        <p className={styles.hint}>
                                            Copy from Excel, Google Sheets, Airtable, or a CSV. Headers are optional if columns are in template order.
                                        </p>

                                        {pastedRows.length > 0 && (
                                            <div className={styles.pastePreview}>
                                                <div className={styles.previewHeader}>
                                                    <span>{pastedRows.length} row{pastedRows.length === 1 ? '' : 's'} ready to upload</span>
                                                    <span>{pastedRows.filter(row => getPastedRowIssue(row)).length} need review</span>
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
                                                            {pastedRows.slice(0, 8).map(row => {
                                                                const issue = getPastedRowIssue(row);
                                                                return (
                                                                    <tr key={row.rowNumber}>
                                                                        <td>{row.rowNumber}</td>
                                                                        <td>{row.data.wordText || '-'}</td>
                                                                        <td>{row.data.englishDefinition || '-'}</td>
                                                                        <td>{row.data.partOfSpeech || '-'}</td>
                                                                        <td>{issue || 'Ready'}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                {pastedRows.length > 8 && (
                                                    <p className={styles.hint}>Showing the first 8 rows. The full pasted set will be uploaded.</p>
                                                )}
                                            </div>
                                        )}
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
                                        {inputMode === 'file' ? 'Upload Translation File' : 'Upload Pasted Rows'}
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

                    <aside className={styles.guideColumn}>
                        <Card className={styles.guideCard}>
                            <h2 className={styles.sectionTitle}>How to Build Your File</h2>
                            <ol className={styles.steps}>
                                <li>Download one of the templates, upload your own spreadsheet, or paste rows directly.</li>
                                <li>
                                    Inside the template, there are 2 valid translation rows/examples: one where both
                                    the required and optional fields are filled out, and one where only the required
                                    fields are filled out. Use it as a guide to add translations and rows to the template.
                                </li>
                                <li>Choose one language for the whole upload.</li>
                                <li>Keep one translation per row. Headers can use names like word, meaning, example, or notes.</li>
                                <li>Upload CSV/XLSX or paste rows from your spreadsheet. Old XLS files are not supported.</li>
                                <li>Review the result for imported, duplicate, or invalid rows.</li>
                            </ol>

                            <div className={styles.fields}>
                                <h3>Required fields</h3>
                                <p><code>wordText</code> - word or phrase in the language.</p>
                                <p><code>englishDefinition</code> - English meaning.</p>

                                <h3>Optional fields</h3>
                                <p><code>partOfSpeech</code> - noun, verb, phrase, etc.</p>
                                <p><code>exampleSentence</code> - sentence using the word.</p>
                                <p><code>usageComment</code> - note on how the word might be used.</p>
                            </div>

                            <div className={styles.duplicateNote}>
                                Duplicate check uses language, word, English definition, and part of speech.
                                The same word can still be uploaded as both a noun and a verb.
                            </div>
                        </Card>

                        {recentBatches.length > 0 && (
                            <Card className={styles.guideCard}>
                                <h2 className={styles.sectionTitle}>Recent Bulk Uploads</h2>
                                <div className={styles.recentList}>
                                    {recentBatches.map(batch => (
                                        <div key={batch.id} className={styles.recentItem}>
                                            <span>{batch.fileName}</span>
                                            <span>{formatStatus(batch.status)}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </aside>
                </div>
            </div>
        </div>
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
