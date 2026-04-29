import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { languageService } from '../../api/languageService';
import Pagination from '../../components/Pagination/Pagination';
import Button from '../../components/Button/Button';
import styles from './CommonWordsPage.module.css';

const COMMON_WORDS_PER_PAGE = 20;

export default function CommonWordsPage() {
    const navigate = useNavigate();
    const [commonWords, setCommonWords] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [retryCount, setRetryCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        let cancelled = false;

        const fetchCommonWords = async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await languageService.getCommonWords(currentPage, COMMON_WORDS_PER_PAGE);

                if (cancelled) return;

                setCommonWords(result.commonWords || []);
                setPagination(result.pagination);

                if (currentPage > 1) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } catch (err) {
                if (cancelled) return;
                setError('Failed to load common words. Please try again.');
                console.error('Error fetching common words:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchCommonWords();
        return () => { cancelled = true; };
    }, [currentPage, retryCount]);

    return (
        <div className={`${styles.commonWordsPage} ${mounted ? styles.mounted : ''}`}>
            <div className={styles.backgroundPattern} />

            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>Common Words</h1>
                        <p className={styles.subtitle}>
                            Browse the 2,809 most-used English words tracked across the project in their original frequency order.
                        </p>
                    </div>
                    <div className={styles.headerActions}>
                        <Button variant="secondary" onClick={() => navigate('/languages')}>
                            Back to Languages
                        </Button>
                    </div>
                </header>

                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner} />
                        <p>Loading common words...</p>
                    </div>
                ) : error ? (
                    <div className={styles.errorCard}>
                        <p>{error}</p>
                        <Button variant="secondary" onClick={() => setRetryCount(count => count + 1)}>
                            Try again
                        </Button>
                    </div>
                ) : commonWords.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No common words are available yet.</p>
                    </div>
                ) : (
                    <>
                        <p className={styles.resultCount}>
                            {pagination?.total.toLocaleString()} common words
                        </p>

                        <div className={styles.wordList}>
                            {commonWords.map((commonWord) => (
                                <article key={commonWord.id} className={styles.wordRow}>
                                    <span className={styles.rank}>#{commonWord.id}</span>
                                    <span className={styles.word}>{commonWord.word}</span>
                                </article>
                            ))}
                        </div>

                        {pagination && pagination.totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={pagination.totalPages}
                                onPageChange={setCurrentPage}
                                totalItems={pagination.total}
                                itemsPerPage={pagination.limit}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
