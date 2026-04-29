import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { languageService } from '../../api/languageService';
import Pagination from '../../components/Pagination/Pagination';
import Button from '../../components/Button/Button';
import styles from './MissingCommonWordsPage.module.css';

const COMMON_WORDS_PER_PAGE = 20;

export default function MissingCommonWordsPage() {
    const { isoCode } = useParams();
    const navigate = useNavigate();
    const [language, setLanguage] = useState(null);
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
        setCurrentPage(1);
    }, [isoCode]);

    useEffect(() => {
        let cancelled = false;

        const fetchPageData = async () => {
            setLoading(true);
            setError(null);

            try {
                const [languageData, result] = await Promise.all([
                    languageService.getLanguageByCode(isoCode),
                    languageService.getMissingCommonWords(isoCode, currentPage, COMMON_WORDS_PER_PAGE)
                ]);

                if (cancelled) return;

                setLanguage(languageData);
                setCommonWords(result.commonWords || []);
                setPagination(result.pagination);

                if (currentPage > 1) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } catch (err) {
                if (cancelled) return;

                if (err.response?.status === 404) {
                    setError('Language not found.');
                } else {
                    setError('Failed to load missing common words. Please try again.');
                }

                console.error('Error fetching missing common words:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchPageData();
        return () => { cancelled = true; };
    }, [isoCode, currentPage, retryCount]);

    return (
        <div className={`${styles.missingCommonWordsPage} ${mounted ? styles.mounted : ''}`}>
            <div className={styles.backgroundPattern} />

            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>
                            {language ? `${language.name} Missing Core Words` : 'Missing Core Words'}
                        </h1>
                        <p className={styles.subtitle}>
                            Words from the tracked 2,809 common-word list that do not yet have any translation record for this language.
                        </p>
                    </div>
                    <div className={styles.headerActions}>
                        <Button variant="secondary" onClick={() => navigate(`/languages/${isoCode}`)}>
                            Back to Language
                        </Button>
                    </div>
                </header>

                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner} />
                        <p>Loading missing words...</p>
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
                        <p>This language already has translation records for all tracked common words.</p>
                    </div>
                ) : (
                    <>
                        <p className={styles.resultCount}>
                            {pagination?.total.toLocaleString()} missing common words
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
