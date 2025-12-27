import { useState, useEffect } from 'react';
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

    const handleUserClick = (userId) => {
        navigate(`/profile/${userId}`);
    };

    return (
        <div className={styles.usersPage}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Users</h1>
                    <p className={styles.subtitle}>
                        Connect with other language learners and contributors
                    </p>
                </header>

                <div className={styles.searchSection}>
                    <Input
                        type="text"
                        placeholder="Search by username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                {error && <div className={styles.error}>{error}</div>}

                {loading ? (
                    <div className={styles.loading}>Loading users...</div>
                ) : users.length === 0 ? (
                    <div className={styles.empty}>
                        {searchQuery 
                            ? 'No users found matching your search.' 
                            : 'No users found.'
                        }
                    </div>
                ) : (
                    <div className={styles.usersGrid}>
                        {users.map((user) => (
                            <Card 
                                key={user.id} 
                                hoverable
                                onClick={() => handleUserClick(user.id)}
                                className={styles.userCard}
                            >
                                <div className={styles.userInfo}>
                                    <h3 className={styles.username}>{user.username}</h3>
                                    <p className={styles.email}>{user.email}</p>
                                    {user.role === 'ADMIN' && (
                                        <span className={styles.adminBadge}>Admin</span>
                                    )}
                                </div>
                                <div className={styles.userStats}>
                                    {user._count && (
                                        <>
                                            <div className={styles.stat}>
                                                <span className={styles.statValue}>
                                                    {user._count.contributions || 0}
                                                </span>
                                                <span className={styles.statLabel}>
                                                    Contributions
                                                </span>
                                            </div>
                                            <div className={styles.stat}>
                                                <span className={styles.statValue}>
                                                    {user._count.createdSets || 0}
                                                </span>
                                                <span className={styles.statLabel}>
                                                    Sets Created
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}