import { useCallback, useEffect, useState } from 'react';
import { importBatchService } from '../../api/importBatchService';
import { languageService } from '../../api/languageService';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal/ConfirmDeleteModal';
import styles from './AdminImportBatchesPage.module.css';

const STATUS_OPTIONS = [
    { value: '', label: 'All' },
    { value: 'PENDING_REVIEW', label: 'Pending review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'ROLLED_BACK', label: 'Rolled back' }
];

const DESTRUCTIVE_ACTIONS = {
    reject: {
        title: 'Reject import batch?',
        verb: 'reject',
        confirmLabel: 'Reject',
        warning: 'Rejecting this batch will delete its imported translations.'
    },
    rollback: {
        title: 'Roll back import batch?',
        verb: 'roll back',
        confirmLabel: 'Roll Back',
        warning: 'Rolling back this approved batch will delete its imported translations.'
    }
};

function formatStatus(status) {
    return status.replace(/_/g, ' ').toLowerCase();
}

function formatDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleString();
}

export default function AdminImportBatchesPage() {
    const [languages, setLanguages] = useState([]);
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [status, setStatus] = useState('PENDING_REVIEW');
    const [languageId, setLanguageId] = useState('');
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState('');
    const [pendingAction, setPendingAction] = useState('');
    const [error, setError] = useState('');

    const loadBatches = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const result = await importBatchService.getAdminImportBatches({
                page: 1,
                limit: 50,
                status,
                languageId
            });
            setBatches(result.batches || []);
        } catch (err) {
            console.error('Failed to load import batches:', err);
            setError('Failed to load import batches.');
        } finally {
            setLoading(false);
        }
    }, [status, languageId]);

    useEffect(() => {
        const loadLanguages = async () => {
            try {
                const result = await languageService.getLanguages(1, 1000);
                setLanguages(result.languages || []);
            } catch (err) {
                console.error('Failed to load languages:', err);
            }
        };

        loadLanguages();
    }, []);

    useEffect(() => {
        loadBatches();
    }, [loadBatches]);

    const openBatch = async (batchId) => {
        setDetailLoading(true);
        setError('');
        try {
            const batch = await importBatchService.getImportBatch(batchId);
            setSelectedBatch(batch);
        } catch (err) {
            console.error('Failed to load import batch:', err);
            setError('Failed to load import batch details.');
        } finally {
            setDetailLoading(false);
        }
    };

    const runAction = async (action) => {
        if (!selectedBatch) return;

        setActionLoading(action);
        setError('');
        try {
            const actions = {
                approve: importBatchService.approveImportBatch,
                reject: importBatchService.rejectImportBatch,
                rollback: importBatchService.rollbackImportBatch
            };
            const updated = await actions[action](selectedBatch.id);
            setSelectedBatch(updated);
            setPendingAction('');
            await loadBatches();
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${action} import batch.`);
        } finally {
            setActionLoading('');
        }
    };

    return (
        <div className={styles.adminImportPage}>
            {pendingAction && selectedBatch && (
                <ConfirmDeleteModal
                    title={DESTRUCTIVE_ACTIONS[pendingAction].title}
                    body={(
                        <p className={styles.modalBody}>
                            Would you like to {DESTRUCTIVE_ACTIONS[pendingAction].verb} <strong>"{selectedBatch.fileName}"</strong>?
                            This action cannot be undone.
                        </p>
                    )}
                    confirmLabel={DESTRUCTIVE_ACTIONS[pendingAction].confirmLabel}
                    warning={DESTRUCTIVE_ACTIONS[pendingAction].warning}
                    onConfirm={() => runAction(pendingAction)}
                    onCancel={() => setPendingAction('')}
                    isDeleting={actionLoading === pendingAction}
                />
            )}
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Import Batches</h1>
                    <p className={styles.subtitle}>
                        Review bulk uploads as batches, while each imported row remains available in translation review.
                    </p>
                </header>

                <div className={styles.controls}>
                    <div className={styles.controlGroup}>
                        <label htmlFor="status" className={styles.label}>Status</label>
                        <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className={styles.select}>
                            {STATUS_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.controlGroup}>
                        <label htmlFor="language" className={styles.label}>Language</label>
                        <select id="language" value={languageId} onChange={(e) => setLanguageId(e.target.value)} className={styles.select}>
                            <option value="">All languages</option>
                            {languages.map(language => (
                                <option key={language.id} value={language.id}>
                                    {language.name}{language.isoCode ? ` (${language.isoCode.toUpperCase()})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.layout}>
                    <Card className={styles.listCard}>
                        <h2 className={styles.sectionTitle}>Batches</h2>
                        {loading ? (
                            <p className={styles.muted}>Loading import batches...</p>
                        ) : batches.length === 0 ? (
                            <p className={styles.muted}>No import batches found.</p>
                        ) : (
                            <div className={styles.batchList}>
                                {batches.map(batch => (
                                    <button
                                        key={batch.id}
                                        type="button"
                                        onClick={() => openBatch(batch.id)}
                                        className={`${styles.batchItem} ${selectedBatch?.id === batch.id ? styles.selected : ''}`}
                                    >
                                        <span>
                                            <strong>{batch.fileName}</strong>
                                            <small>{batch.language?.name} · {batch.uploadedBy?.username || 'Unknown user'}</small>
                                        </span>
                                        <span className={`${styles.badge} ${styles[batch.status]}`}>{formatStatus(batch.status)}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card className={styles.detailCard}>
                        {!selectedBatch ? (
                            <p className={styles.muted}>{detailLoading ? 'Loading batch...' : 'Select a batch to review its rows.'}</p>
                        ) : (
                            <>
                                <div className={styles.detailHeader}>
                                    <div>
                                        <h2 className={styles.sectionTitle}>{selectedBatch.fileName}</h2>
                                        <p className={styles.muted}>
                                            {selectedBatch.language?.name} · uploaded by {selectedBatch.uploadedBy?.username || 'Unknown user'} · {formatDate(selectedBatch.createdAt)}
                                        </p>
                                    </div>
                                    <span className={`${styles.badge} ${styles[selectedBatch.status]}`}>{formatStatus(selectedBatch.status)}</span>
                                </div>

                                <div className={styles.summaryGrid}>
                                    <SummaryItem label="Total" value={selectedBatch.totalRows} />
                                    <SummaryItem label="Imported" value={selectedBatch.importedRows} />
                                    <SummaryItem label="Skipped" value={selectedBatch.skippedRows} />
                                    <SummaryItem label="Rejected" value={selectedBatch.rejectedRows} />
                                </div>

                                <div className={styles.actions}>
                                    {selectedBatch.status === 'PENDING_REVIEW' && (
                                        <>
                                            <Button type="button" onClick={() => runAction('approve')} loading={actionLoading === 'approve'}>
                                                Approve Batch
                                            </Button>
                                            <Button type="button" variant="danger" onClick={() => setPendingAction('reject')} loading={actionLoading === 'reject'}>
                                                Reject Batch
                                            </Button>
                                        </>
                                    )}
                                    {selectedBatch.status === 'APPROVED' && (
                                        <Button type="button" variant="danger" onClick={() => setPendingAction('rollback')} loading={actionLoading === 'rollback'}>
                                            Roll Back Batch
                                        </Button>
                                    )}
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
                                            {selectedBatch.rows?.map(row => (
                                                <tr key={row.id}>
                                                    <td>{row.rowNumber}</td>
                                                    <td>{row.wordText || '-'}</td>
                                                    <td>{row.englishDefinition || '-'}</td>
                                                    <td>{row.partOfSpeech || '-'}</td>
                                                    <td>
                                                        <span className={`${styles.badge} ${styles[row.status]}`}>{formatStatus(row.status)}</span>
                                                        {row.errorMessage && <p className={styles.rowError}>{row.errorMessage}</p>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </Card>
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
