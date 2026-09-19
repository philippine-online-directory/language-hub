import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { languageService } from '../../api/languageService';
import useDebounce from '../../hooks/useDebounce';
import LanguageCard from '../../components/LanguageCard/LanguageCard';
import Pagination from '../../components/Pagination/Pagination';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import LoadingSkeleton from '../../components/LoadingSkeleton/LoadingSkeleton';
import styles from './LanguagesPage.module.css';

export default function LanguagesPage() {
    const navigate = useNavigate();
    const [languages, setLanguages] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [mounted, setMounted] = useState(false);

    const debouncedSearch = useDebounce(searchQuery, 500);
    const LANGUAGES_PER_PAGE = 20;

    useEffect(() => {
        setMounted(true);
    }, []);

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch]);

    useEffect(() => {
        const fetchLanguages = async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await languageService.getLanguages(
                    currentPage,
                    LANGUAGES_PER_PAGE,
                    debouncedSearch
                );

                setLanguages(result.languages);
                setPagination(result.pagination);

                if (currentPage > 1) {
                    window.scrollTo({ top: 200, behavior: 'auto' });
                }
            }
            catch (err) {
                setError('Failed to load languages. Please try again.');
                console.error('Error fetching languages:', err);
            }
            finally {
                setLoading(false);
            }
        };

        fetchLanguages();
    }, [debouncedSearch, currentPage]);

    return (
        <div className={`${styles.languagesPage} ${mounted ? styles.mounted : ''}`}>
            <div className={styles.backgroundPattern}></div>

            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>Explore Languages</h1>
                        <p className={styles.subtitle}>
                            Discover and learn from endangered and minority languages around the Philippines
                        </p>
                    </div>
                    <div className={styles.headerActions}>
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/common-words')}
                        >
                            View Common Words
                        </Button>
                    </div>
                </header>

                <div className={styles.requestNotice}>
                    Want a new language or dictionary added?{' '}
                    <a href="mailto:jongnavarro@jongnavarro.com" className={styles.requestLink}>
                        Email us at jongnavarro@jongnavarro.com
                    </a>
                </div>

                <div className={styles.searchSection}>
                    <Input
                        type="text"
                        placeholder="Search languages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                {error && <div className={styles.error}>{error}</div>}

                {loading ? (
                    <LoadingSkeleton label="Loading languages" />
                ) : languages.length === 0 ? (
                    <div className={styles.empty}>
                        <svg className={styles.emptyIcon} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                        <p>
                            {searchQuery
                                ? 'No languages found matching your search.'
                                : 'No languages available yet.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className={styles.languagesGrid}>
                            {languages.map((language) => (
                                <div key={language.id}>
                                    <LanguageCard language={language} />
                                </div>
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
