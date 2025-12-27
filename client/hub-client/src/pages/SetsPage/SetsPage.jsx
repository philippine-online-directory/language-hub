import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setService } from '../../api/setService';
import useDebounce from '../../hooks/useDebounce';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import styles from './SetsPage.module.css';

export default function SetsPage(){
    const navigate = useNavigate();
    const [sets, setSets] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('my'); 

    const debouncedSearch = useDebounce(searchQuery, 500);

    useEffect(() => {
        const fetchSets = async () => {
            setLoading(true);
            setError(null);
            try {
                if (viewMode === 'my') {
                    const data = await setService.getUserSets();
                    setSets(data);
                } 
                else {
                    const data = await setService.searchPublicSets(debouncedSearch);
                    setSets(data);
                }
            } 
            catch (err) {
                setError('Failed to load sets. Please try again.');
                console.error('Error fetching sets:', err);
            } 
            finally {
                setLoading(false);
            }
        };

        fetchSets();
    }, [viewMode, debouncedSearch]);

    const handleDelete = async (setId, e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!window.confirm('Are you sure you want to delete this set?')) {
            return;
        }

        try {
            await setService.deleteSet(setId);
            setSets(sets.filter((set) => set.id !== setId));
        } 
        catch (err) {
            alert('Failed to delete set. Please try again.');
            console.error('Error deleting set:', err);
        }
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        setSearchQuery('');
    };

    return (
        <div className={styles.setsPage}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Vocabulary Sets</h1>
                        <p className={styles.subtitle}>
                            {viewMode === 'my' 
                                ? 'Create and manage your language learning collections'
                                : 'Discover sets created by other learners'
                            }
                        </p>
                    </div>
                    {viewMode === 'my' && (
                        <Button variant="primary" onClick={() => navigate('/sets/create')}>
                            Create New Set
                        </Button>
                    )}
                </header>

                <div className={styles.controls}>
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${viewMode === 'my' ? styles.activeTab : ''}`}
                            onClick={() => handleViewModeChange('my')}
                        >
                            My Sets
                        </button>
                        <button
                            className={`${styles.tab} ${viewMode === 'public' ? styles.activeTab : ''}`}
                            onClick={() => handleViewModeChange('public')}
                        >
                            Public Sets
                        </button>
                    </div>

                    {viewMode === 'public' && (
                        <Input
                            type="text"
                            placeholder="Search public sets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    )}
                </div>

                {error && <div className={styles.error}>{error}</div>}

                {loading ? (
                    <div className={styles.loading}>Loading sets...</div>
                ) : sets.length === 0 ? (
                    <div className={styles.empty}>
                        {viewMode === 'my' ? (
                            <>
                                <p>You haven't created any sets yet.</p>
                                <Button variant="primary" onClick={() => navigate('/sets/create')}>
                                    Create Your First Set
                                </Button>
                            </>
                        ) : (
                            <p>No public sets found{searchQuery ? ' matching your search' : ''}.</p>
                        )}
                    </div>
                ) : (
                    <div className={styles.setsGrid}>
                        {sets.map((set) => (
                            <Link key={set.id} to={`/sets/${set.id}`} className={styles.setLink}>
                                <Card hoverable className={styles.setCard}>
                                    <div className={styles.setHeader}>
                                        <h3 className={styles.setName}>{set.name}</h3>
                                        {set.isPublic && <span className={styles.publicBadge}>Public</span>}
                                    </div>
                                    <p className={styles.setDescription}>{set.description}</p>
                                    <div className={styles.setMeta}>
                                        <span className={styles.metaItem}>
                                            {set._count?.setWords || 0} words
                                        </span>
                                        {set.language && (
                                            <span className={styles.metaItem}>
                                                {set.language.name}
                                            </span>
                                        )}
                                        {viewMode === 'public' && set.owner && (
                                            <span className={styles.metaItem}>
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
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}