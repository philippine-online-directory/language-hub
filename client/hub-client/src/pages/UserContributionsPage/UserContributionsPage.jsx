import { useState, useEffect } from 'react';
import { contributionService } from '../../api/contributionService';
import WordDisplay from '../../components/WordDisplay/WordDisplay';
import Pagination from '../../components/Pagination/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton/LoadingSkeleton';
import styles from './UserContributionsPage.module.css';

export default function UserContributionsPage() {
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    const CONTRIBUTIONS_PER_PAGE = 20;

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        setExpandedId(null);
        const fetchContributions = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const result = await contributionService.getUserContributions(currentPage, CONTRIBUTIONS_PER_PAGE);
                setContributions(result.contributions);
                setPagination(result.pagination);

                if (currentPage > 1) {
                    window.scrollTo({ top: 200, behavior: 'auto' });
                }
            } catch (err) {
                setError('Failed to load contributions. Please try again.');
                console.error('Error fetching contributions:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchContributions();
    }, [currentPage]);

    return (
        <div className={`${styles.contributionsPage} ${mounted ? styles.mounted : ''}`}>
            <div className={styles.backgroundPattern}></div>
            
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>My Contributions</h1>
                    <p className={styles.subtitle}>
                        Track all the translations and words you've contributed to the community
                    </p>
                </header>

                {error && <div className={styles.error}>{error}</div>}

                {loading ? (
                    <LoadingSkeleton variant="contributions" label="Loading contributions" />
                ) : contributions.length === 0 ? (
                    <div className={styles.empty}>
                        <svg className={styles.emptyIcon} viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                        <p>You haven't made any contributions yet.</p>
                        <p className={styles.emptySubtext}>
                            Start contributing translations to help preserve endangered languages!
                        </p>
                    </div>
                ) : (
                    <>
                        <div className={styles.statsBar}>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>{pagination?.total || 0}</span>
                                <span className={styles.statLabel}>Total Contributions</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>
                                    {contributions.filter(c => c.status === 'VERIFIED').length}
                                </span>
                                <span className={styles.statLabel}>Verified</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>
                                    {contributions.filter(c => c.status === 'UNVERIFIED').length}
                                </span>
                                <span className={styles.statLabel}>Pending</span>
                            </div>
                        </div>

                        <div className={styles.contributionsGrid}>
                            {contributions.map((contribution) => (
                                <div key={contribution.id}>
                                    <WordDisplay
                                        translation={contribution}
                                        showAddToSet={true}
                                        expanded={expandedId === contribution.id}
                                        onToggle={setExpandedId}
                                    />
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
