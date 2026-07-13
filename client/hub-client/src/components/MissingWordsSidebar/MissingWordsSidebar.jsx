import { useState, useEffect, useCallback } from 'react';
import { languageService } from '../../api/languageService';
import Pagination from '../Pagination/Pagination';
import styles from './MissingWordsSidebar.module.css';

const WORDS_PER_PAGE = 20;

export default function MissingWordsSidebar({
    slug,
    onWordClick,
    defaultOpen,
    clickHint = 'Click to translate',
    showToggle = true
}) {
    const [isOpen, setIsOpen] = useState(() => {
        if (defaultOpen !== undefined) return defaultOpen;
        return typeof window !== 'undefined' ? !window.matchMedia('(max-width: 768px)').matches : true;
    });
    const [missingWords, setMissingWords] = useState([]);
    const [missingPagination, setMissingPagination] = useState(null);
    const [missingPage, setMissingPage] = useState(1);
    const [missingLoading, setMissingLoading] = useState(false);
    const [missingError, setMissingError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        setMissingPage(1);
    }, [slug]);

    useEffect(() => {
        if (!slug) {
            setMissingWords([]);
            setMissingPagination(null);
            setMissingLoading(false);
            return;
        }

        let cancelled = false;
        setMissingLoading(true);
        setMissingError(null);

        const fetchWords = async () => {
            try {
                const result = await languageService.getMissingCommonWords(slug, missingPage, WORDS_PER_PAGE);
                if (cancelled) return;
                setMissingWords(result.commonWords || []);
                setMissingPagination(result.pagination || null);
            } catch {
                if (cancelled) return;
                setMissingError('Failed to load words needing translation.');
            } finally {
                if (!cancelled) setMissingLoading(false);
            }
        };

        fetchWords();
        return () => { cancelled = true; };
    }, [slug, missingPage, retryCount]);

    const handleRetry = useCallback(() => setRetryCount(c => c + 1), []);

    const total = missingPagination?.total ?? missingWords.length;

    return (
        <div className={styles.sidebar}>
            <div className={styles.header}>
                <h3 className={styles.title}>
                    Words Needing Translation
                    {slug && (
                        <span className={styles.count}>
                            ({missingPagination ? total.toLocaleString() : '…'})
                        </span>
                    )}
                </h3>
                {showToggle && (
                    <button
                        type="button"
                        className={styles.toggleBtn}
                        onClick={() => setIsOpen(o => !o)}
                        aria-expanded={isOpen}
                    >
                        {isOpen ? 'Hide' : 'Show'}
                    </button>
                )}
            </div>

            {isOpen && (
                <div className={styles.body}>
                    {!slug ? (
                        <p className={styles.placeholder}>Select a language to see words needing translation</p>
                    ) : missingLoading ? (
                        <div className={styles.loadingState}>
                            <div className={styles.spinner} />
                            <p>Loading words needing translation…</p>
                        </div>
                    ) : missingError ? (
                        <div className={styles.errorCard}>
                            <svg viewBox="0 0 20 20" fill="currentColor" className={styles.errorIcon}>
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <p>{missingError}</p>
                            <button type="button" className={styles.retryBtn} onClick={handleRetry}>
                                Try again
                            </button>
                        </div>
                    ) : missingWords.length === 0 ? (
                        <div className={styles.empty}>
                            <svg className={styles.emptyIcon} viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                            </svg>
                            <p>All common words have been contributed!</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.wordsScroller}>
                                <div className={styles.wordsList}>
                                    {missingWords.map(word => (
                                        <button
                                            key={word.id}
                                            type="button"
                                            className={styles.wordCard}
                                            onClick={() => onWordClick(word)}
                                        >
                                            <span className={styles.wordText}>{word.word}</span>
                                            <span className={styles.wordHint}>{clickHint}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {missingPagination && missingPagination.totalPages > 1 && (
                                <div className={styles.paginationSlot}>
                                    <Pagination
                                        currentPage={missingPage}
                                        totalPages={missingPagination.totalPages}
                                        onPageChange={setMissingPage}
                                        totalItems={missingPagination.total}
                                        itemsPerPage={WORDS_PER_PAGE}
                                        compact
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
