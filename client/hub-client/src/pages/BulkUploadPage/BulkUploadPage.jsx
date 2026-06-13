import { useEffect, useState } from 'react';
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
    'ipa',
    'exampleSentence',
    'usageComment'
];

const SAMPLE_ROWS = [
    ['kamusta', 'hello', 'interjection', '', 'Kamusta ka?', 'Common greeting'],
    ['takbo', 'run', 'verb', '', '', ''],
    ['takbo', 'run', 'noun', '', '', 'Allowed because part of speech differs']
];

function downloadTemplate() {
    const rows = [TEMPLATE_HEADERS, ...SAMPLE_ROWS];
    const csv = rows
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bulk-translation-template.csv';
    link.click();
    URL.revokeObjectURL(url);
}

function formatStatus(status) {
    return status.replace(/_/g, ' ').toLowerCase();
}

export default function BulkUploadPage() {
    const [languages, setLanguages] = useState([]);
    const [languageId, setLanguageId] = useState('');
    const [file, setFile] = useState(null);
    const [rightsConfirmed, setRightsConfirmed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [languagesLoading, setLanguagesLoading] = useState(true);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [recentBatches, setRecentBatches] = useState([]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setResult(null);

        if (!languageId) {
            setError('Choose the language this file belongs to.');
            return;
        }

        if (!file) {
            setError('Choose a CSV or XLSX file to upload.');
            return;
        }

        if (!rightsConfirmed) {
            setError('Confirm that you have permission to contribute this data.');
            return;
        }

        setLoading(true);
        try {
            const batch = await importBatchService.createImportBatch({
                languageId,
                file,
                rightsConfirmed
            });
            setResult(batch);
            setRecentBatches(prev => [batch, ...prev].slice(0, 5));
            setFile(null);
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
                                    <label htmlFor="file" className={styles.label}>CSV or XLSX file</label>
                                    <input
                                        id="file"
                                        type="file"
                                        accept=".csv,.xlsx"
                                        onChange={handleFileChange}
                                        className={styles.fileInput}
                                    />
                                    {file && (
                                        <p className={styles.fileName}>
                                            Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                        </p>
                                    )}
                                </div>

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
                                    <Button type="submit" loading={loading} disabled={languagesLoading}>
                                        Upload Translation File
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={downloadTemplate}>
                                        Download CSV Template
                                    </Button>
                                </div>
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
                                <li>Choose one language for the whole upload.</li>
                                <li>Use the header names below in the first row.</li>
                                <li>Fill one translation per row.</li>
                                <li>Upload CSV or XLSX. Old XLS files are not supported.</li>
                                <li>Review the result for imported, duplicate, or invalid rows.</li>
                            </ol>

                            <div className={styles.fields}>
                                <h3>Required fields</h3>
                                <p><code>wordText</code> - word or phrase in the language.</p>
                                <p><code>englishDefinition</code> - English meaning.</p>

                                <h3>Optional fields</h3>
                                <p><code>partOfSpeech</code> - noun, verb, phrase, etc.</p>
                                <p><code>ipa</code> - pronunciation in IPA.</p>
                                <p><code>exampleSentence</code> - sentence using the word.</p>
                                <p><code>usageComment</code> - short note on context or use.</p>
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
