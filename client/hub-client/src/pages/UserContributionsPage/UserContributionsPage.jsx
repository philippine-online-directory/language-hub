import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contributionService } from '../../api/contributionService';
import WordDisplay from '../../components/WordDisplay/WordDisplay';
import Button from '../../components/Button/Button';
import styles from './UserContributionsPage.module.css';

export default function UserContributionsPage(){
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    if (loading) {
        return (
            <div className={styles.contributionsPage}>
                <div className={styles.container}>
                    <div className={styles.loading}>Loading your contributions...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.contributionsPage}>
                <div className={styles.container}>
                    <div className={styles.error}>{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.contributionsPage}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.title}>My Contributions</h1>
                        <p className={styles.subtitle}>
                            {contributions.length} {contributions.length === 1 ? 'word' : 'words'} contributed
                        </p>
                    </div>
                    <Link to="/contribute">
                        <Button variant="primary">Add New Word</Button>
                    </Link>
                </header>

                {contributions.length === 0 ? (
                    <div className={styles.empty}>
                        <p>You haven't contributed any words yet.</p>
                        <Link to="/contribute">
                        <Button variant="primary">Make Your First Contribution</Button>
                        </Link>
                    </div>
                ) : (
                    <div className={styles.contributionsGrid}>
                        {contributions.map((contribution) => (
                        <div key={contribution.id} className={styles.contributionItem}>
                            <WordDisplay translation={contribution} showAddToSet={false} />
                                <div className={styles.contributionMeta}>
                                <span className={styles.status}>
                                    Status: {contribution.status === 'VERIFIED' ? 'Verified' : 'Pending Review'}
                                </span>
                                <span className={styles.date}>
                                    {new Date(contribution.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

}