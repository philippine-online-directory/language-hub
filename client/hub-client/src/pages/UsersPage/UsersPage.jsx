import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { profileService } from '../../api/profileService';
import useDebounce from '../../hooks/useDebounce';
import Card from '../../components/Card/Card';
import Input from '../../components/Input/Input';
import Pagination from '../../components/Pagination/Pagination';
import styles from './UsersPage.module.css';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [mounted, setMounted] = useState(false);
    const gridRef = useRef(null);

    const debouncedSearch = useDebounce(searchQuery, 500);
    const USERS_PER_PAGE = 20;

    useEffect(() => {
        setMounted(true);
    }, []);

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch]);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await profileService.searchUsers(currentPage, USERS_PER_PAGE, debouncedSearch);
                setUsers(result.users);
                setPagination(result.pagination);

                if (currentPage > 1) {
                    window.scrollTo({ top: 200, behavior: 'smooth' });
                }
            } catch (err) {
                setError('Failed to load users. Please try again.');
                console.error('Error fetching users:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [debouncedSearch, currentPage]);

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
    }, [users]);

    return (
        <div className={`${styles.usersPage} ${mounted ? styles.mounted : ''}`}>
            <div className={styles.backgroundPattern}></div>
            
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Community Members</h1>
                    <p className={styles.subtitle}>
                        Explore profiles of contributors helping to preserve endangered languages
                    </p>
                </header>

                <div className={styles.searchSection}>
                    <Input
                        type="text"
                        placeholder="Search users by username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                {error && <div className={styles.error}>{error}</div>}

                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Loading users...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className={styles.empty}>
                        <svg className={styles.emptyIcon} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                        <p>
                            {searchQuery
                                ? 'No users found matching your search.'
                                : 'No users found.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className={styles.usersGrid} ref={gridRef}>
                            {users.map((user, index) => (
                                <div
                                    key={user.id}
                                    className={styles.animateItem}
                                    style={{ '--item-index': index }}
                                >
                                    <Link to={`/profile/${user.id}`} className={styles.userLink}>
                                        <Card hoverable className={styles.userCard}>
                                            <div className={styles.userHeader}>
                                                <div className={styles.avatar}>
                                                    <span className={styles.avatarText}>
                                                        {user.username.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className={styles.userInfo}>
                                                    <h3 className={styles.username}>{user.username}</h3>
                                                    {user.role === 'ADMIN' && (
                                                        <span className={styles.adminBadge}>
                                                            <svg className={styles.badgeIcon} viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={styles.userStats}>
                                                <div className={styles.statItem}>
                                                    <svg className={styles.statIcon} viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                                                    </svg>
                                                    <span className={styles.statValue}>{user._count?.contributions || 0}</span>
                                                    <span className={styles.statLabel}>Contributions</span>
                                                </div>
                                                <div className={styles.statItem}>
                                                    <svg className={styles.statIcon} viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                                    </svg>
                                                    <span className={styles.statValue}>{user._count?.createdSets || 0}</span>
                                                    <span className={styles.statLabel}>Sets</span>
                                                </div>
                                            </div>
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