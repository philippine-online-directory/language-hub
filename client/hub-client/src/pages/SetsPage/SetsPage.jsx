import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setService } from '../../api/setService';
import { useAuth } from '../../context/AuthContext';
import useDebounce from '../../hooks/useDebounce';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Pagination from '../../components/Pagination/Pagination';
import styles from './SetsPage.module.css';

export default function SetsPage(){
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [sets, setSets] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('public');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [mounted, setMounted] = useState(false);
    const gridRef = useRef(null);

    const debouncedSearch = useDebounce(searchQuery, 500);
    const SETS_PER_PAGE = 12;

    useEffect(() => {
        setMounted(true);
    }, []);

    // Set default view to 'my' if user is authenticated
    useEffect(() => {
        if (isAuthenticated) {
            setViewMode('my');
        }
    }, [isAuthenticated]);

    // Reset to page 1 when view mode or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [viewMode, debouncedSearch]);

    useEffect(() => {
        const fetchSets = async () => {
            setLoading(true);
            setError(null);

            // If trying to view "My Sets" without authentication, don't fetch
            if (viewMode === 'my' && !isAuthenticated) {
                setSets([]);
                setPagination(null);
                setLoading(false);
                return;
            }

            try {
                let result;
                if (viewMode === 'my') {
                    result = await setService.getUserSets(currentPage, SETS_PER_PAGE);
                } else {
                    result = await setService.searchPublicSets(currentPage, SETS_PER_PAGE, debouncedSearch);
                }
                
                setSets(result.sets);
                setPagination(result.pagination);

                if (currentPage > 1) {
                    window.scrollTo({ top: 200, behavior: 'smooth' });
                }
            } catch (err) {
                setError('Failed to load sets. Please try again.');
                console.error('Error fetching sets:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSets();
    }, [viewMode, debouncedSearch, currentPage, isAuthenticated]);

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
    }, [sets]);

    const handleDelete = async (setId, e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!window.confirm('Are you sure you want to delete this set?')) {
            return;
        }

        try {
            await setService.deleteSet(setId);
            setSets(sets.filter((set) => set.id !== setId));
            
            // If deleted the last item on a page that isn't page 1, go back one page
            if (pagination && sets.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
        } catch (err) {
            alert('Failed to delete set. Please try again.');
            console.error('Error deleting set:', err);
        }
    };

    return (
        <div className={`${styles.setsPage} ${mounted ? styles.mounted : ''}`}>
            <div className={styles.backgroundPattern}></div>
            
            <div className={styles.container}>
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>Vocabulary Sets</h1>
                        <p className={styles.subtitle}>
                            {viewMode === 'my' 
                                ? (isAuthenticated ? 'Create and manage your language learning collections' : 'Sign in to create and manage your vocabulary sets')
                                : 'Discover sets created by other learners'
                            }
                        </p>
                    </div>
                    {viewMode === 'my' && isAuthenticated && (
                        <Button variant="primary" onClick={() => navigate('/sets/create')}>
                            Create New Set
                        </Button>
                    )}
                </header>

                {/* Controls */}
                <div className={styles.controls}>
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${viewMode === 'my' ? styles.activeTab : ''}`}
                            onClick={() => {
                                setViewMode('my');
                                setSearchQuery('');
                            }}
                        >
                            <svg className={styles.tabIcon} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            My Sets
                        </button>
                        <button
                            className={`${styles.tab} ${viewMode === 'public' ? styles.activeTab : ''}`}
                            onClick={() => {
                                setViewMode('public');
                                setSearchQuery('');
                            }}
                        >
                            <svg className={styles.tabIcon} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                            </svg>
                            Public Sets
                        </button>
                    </div>

                    {viewMode === 'public' && (
                        <div className={styles.searchWrapper}>
                            <Input
                                type="text"
                                placeholder="Search public sets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                    )}
                </div>

                {/* Error State */}
                {error && <div className={styles.error}>{error}</div>}

                {/* Loading State */}
                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Loading sets...</p>
                    </div>
                ) : sets.length === 0 ? (
                    /* Empty State */
                    <div className={styles.empty}>
                        {viewMode === 'my' ? (
                            <>
                                <svg className={styles.emptyIcon} viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                </svg>
                                {!isAuthenticated ? (
                                    <p>
                                        <Link to="/login">Sign in</Link> to create and manage your vocabulary sets.
                                    </p>
                                ) : (
                                    <>
                                        <p>You haven't created any sets yet.</p>
                                        <Button variant="primary" onClick={() => navigate('/sets/create')}>
                                            Create Your First Set
                                        </Button>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <svg className={styles.emptyIcon} viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                                <p>No public sets found{searchQuery ? ' matching your search' : ''}.</p>
                            </>
                        )}
                    </div>
                ) : (
                    /* Sets Grid */
                    <>
                        <div className={styles.setsGrid} ref={gridRef}>
                            {sets.map((set, index) => (
                                <div
                                    key={set.id}
                                    className={styles.animateItem}
                                    style={{ '--item-index': index }}
                                >
                                    <Link to={`/sets/${set.id}`} className={styles.setLink}>
                                        <Card hoverable className={styles.setCard}>
                                            <div className={styles.setHeader}>
                                                <h3 className={styles.setName}>{set.name}</h3>
                                                {set.isPublic && (
                                                    <span className={styles.publicBadge}>
                                                        <svg className={styles.badgeIcon} viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                                                        </svg>
                                                        Public
                                                    </span>
                                                )}
                                            </div>
                                            <p className={styles.setDescription}>{set.description}</p>
                                            <div className={styles.setMeta}>
                                                <span className={styles.metaItem}>
                                                    <svg className={styles.metaIcon} viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                                                    </svg>
                                                    {set._count?.setWords || 0} words
                                                </span>
                                                {set.language && (
                                                    <span className={styles.metaItem}>
                                                        <svg className={styles.metaIcon} viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
                                                        </svg>
                                                        {set.language.name}
                                                    </span>
                                                )}
                                                {viewMode === 'public' && set.owner && (
                                                    <span className={styles.metaItem}>
                                                        <svg className={styles.metaIcon} viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                        </svg>
                                                        by {set.owner.username}
                                                    </span>
                                                )}
                                            </div>
                                            {viewMode === 'my' && (
                                                <div className={styles.setActions}>
                                                    <Button
                                                        variant="secondary"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            navigate(`/sets/${set.id}/edit`);
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        onClick={(e) => handleDelete(set.id, e)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            )}
                                        </Card>
                                    </Link>
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