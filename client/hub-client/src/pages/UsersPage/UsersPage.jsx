import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../../api/profileService';
import useDebounce from '../../hooks/useDebounce';
import Card from '../../components/Card/Card';
import Input from '../../components/Input/Input';
import styles from './UsersPage.module.css';

export default function UsersPage(){
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const gridRef = useRef(null);

    const debouncedSearch = useDebounce(searchQuery, 500);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await profileService.searchUsers(debouncedSearch);
                setUsers(data);
            } 
            catch (err) {
                setError('Failed to load users. Please try again.');
                console.error('Error fetching users:', err);
            } 
            finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [debouncedSearch]);

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

    const handleUserClick = (userId) => {
        navigate(`/profile/${userId}`);
    };

    return (
        <div className={styles.usersPage}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>Community</h1>
                        <p className={styles.subtitle}>
                            Connect with {users.length} language learner{users.length !== 1 ? 's' : ''} and contributor{users.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </header>

                <div className={styles.searchSection}>
                    <div className={styles.searchWrapper}>
                        <Input
                            type="text"
                            placeholder="Search by username..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                </div>

                {error && (
                    <div className={styles.errorState}>
                        <p>{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Loading users...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className={styles.empty}>
                        <svg className={styles.emptyIcon} viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        <p>
                            {searchQuery 
                                ? 'No users found matching your search.' 
                                : 'No users found.'
                            }
                        </p>
                        {searchQuery && (
                            <button 
                                className={styles.clearSearchButton}
                                onClick={() => setSearchQuery('')}
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={styles.usersGrid} ref={gridRef}>
                        {users.map((user, index) => (
                            <div
                                key={user.id}
                                className={styles.animateItem}
                                style={{ '--item-index': index }}
                            >
                                <Card 
                                    hoverable
                                    onClick={() => handleUserClick(user.id)}
                                    className={styles.userCard}
                                >
                                    <div className={styles.userInfo}>
                                        <div className={styles.userHeader}>
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
                                        <p className={styles.email}>{user.email}</p>
                                        <p className={styles.joinDate}>
                                            Joined {new Date(user.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div className={styles.userStats}>
                                        <div className={styles.stat}>
                                            <span className={styles.statValue}>
                                                {user._count?.contributions || 0}
                                            </span>
                                            <span className={styles.statLabel}>
                                                Contributions
                                            </span>
                                        </div>
                                        <div className={styles.stat}>
                                            <span className={styles.statValue}>
                                                {user._count?.createdSets || 0}
                                            </span>
                                            <span className={styles.statLabel}>
                                                Sets
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}