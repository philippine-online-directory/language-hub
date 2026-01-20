import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { contributionService } from '../../api/contributionService';
import WordDisplay from '../../components/WordDisplay/WordDisplay';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import styles from './UserContributionsPage.module.css';

export default function UserContributionsPage(){
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'verified', 'unverified'
    const gridRef = useRef(null);

    useEffect(() => {
        const fetchContributions = async () => {
            setLoading(true);
            setError(null);

            try {
                const data = await contributionService.getUserContributions();
                setContributions(data);
            } 
            catch (err) {
                setError('Failed to load your contributions. Please try again.');
                console.error('Error fetching contributions:', err);
            } 
            finally {
                setLoading(false);
            }
        };

        fetchContributions();
    }, []);

    // Scroll animation observer
    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion || !gridRef.current) return;

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observerCallback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(styles.visible);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        const items = gridRef.current.querySelectorAll(`.${styles.animateItem}`);
        items.forEach(item => observer.observe(item));

        return () => observer.disconnect();
    }, [contributions, filter]);

    const filteredContributions = contributions.filter(contribution => {
        if (filter === 'verified') return contribution.status === 'VERIFIED';
        if (filter === 'unverified') return contribution.status === 'UNVERIFIED';
        return true;
    });

    const verifiedCount = contributions.filter(c => c.status === 'VERIFIED').length;
    const unverifiedCount = contributions.filter(c => c.status === 'UNVERIFIED').length;

    if (loading) {
        return (
            <div className={styles.contributionsPage}>
                <div className={styles.container}>
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Loading your contributions...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.contributionsPage}>
                <div className={styles.container}>
                    <div className={styles.errorState}>
                        <p>{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.contributionsPage}>
            <div className={styles.container}>
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>My Contributions</h1>
                        <p className={styles.subtitle}>
                            {contributions.length} {contributions.length === 1 ? 'word' : 'words'} contributed
                        </p>
                    </div>
                    <Link to="/contribute" className={styles.headerActionLink}>
                        <Button variant="primary">Add New Word</Button>
                    </Link>
                </header>

                {contributions.length === 0 ? (
                    <div className={styles.empty}>
                        <p>You haven't contributed any words yet.</p>
                        <Link to="/contribute" className={styles.emptyActionLink}>
                            <Card hoverable className={styles.actionCard}>
                                <h3 className={styles.actionTitle}>Make Your First Contribution</h3>
                                <p className={styles.actionDescription}>
                                    Help preserve endangered languages by sharing words
                                </p>
                            </Card>
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <span className={styles.statValue}>{contributions.length}</span>
                                <span className={styles.statLabel}>Total</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statValue}>{verifiedCount}</span>
                                <span className={styles.statLabel}>Verified</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statValue}>{unverifiedCount}</span>
                                <span className={styles.statLabel}>Pending</span>
                            </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className={styles.filters}>
                            <button
                                className={`${styles.filterTab} ${filter === 'all' ? styles.activeFilter : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                All ({contributions.length})
                            </button>
                            <button
                                className={`${styles.filterTab} ${filter === 'verified' ? styles.activeFilter : ''}`}
                                onClick={() => setFilter('verified')}
                            >
                                Verified ({verifiedCount})
                            </button>
                            <button
                                className={`${styles.filterTab} ${filter === 'unverified' ? styles.activeFilter : ''}`}
                                onClick={() => setFilter('unverified')}
                            >
                                Pending ({unverifiedCount})
                            </button>
                        </div>

                        {/* Contributions Grid */}
                        <div className={styles.contributionsGrid} ref={gridRef}>
                            {filteredContributions.map((contribution, index) => (
                                <div 
                                    key={contribution.id} 
                                    className={`${styles.contributionItem} ${styles.animateItem}`}
                                    style={{ '--item-index': index }}
                                >
                                    <WordDisplay 
                                        translation={contribution} 
                                        showAddToSet={false} 
                                    />
                                    <div className={styles.contributionMeta}>
                                        <span className={`${styles.status} ${styles[contribution.status.toLowerCase()]}`}>
                                            {contribution.status === 'VERIFIED' ? (
                                                <>
                                                    <svg className={styles.statusIcon} viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    Verified
                                                </>
                                            ) : (
                                                <>
                                                    <svg className={styles.statusIcon} viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                    </svg>
                                                    Pending Review
                                                </>
                                            )}
                                        </span>
                                        <span className={styles.date}>
                                            {new Date(contribution.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}