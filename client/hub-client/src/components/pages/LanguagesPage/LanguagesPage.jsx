import { useState, useEffect } from 'react';
import { languageService } from '../../api/languageService';
import useDebounce from '../../hooks/useDebounce';
import LanguageCard from '../../components/LanguageCard/LanguageCard';
import Input from '../../components/Input/Input';
import styles from './LanguagesPage.module.css';

export default function LanguagesPage(){
    const [languages, setLanguages] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const debouncedSearch = useDebounce(searchQuery, 500);

    useEffect(() => {
        const fetchLanguages = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await languageService.getLanguages(debouncedSearch);
                setLanguages(data);
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
    }, [debouncedSearch]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    return (
        <div className={styles.languagesPage}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Explore Languages</h1>
                    <p className={styles.subtitle}>
                        Discover and learn from endangered and minority languages around the world
                    </p>
                </header>

                <div className={styles.searchSection}>
                    <Input
                        type="text"
                        placeholder="Search languages..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className={styles.searchInput}
                    />
                </div>

                {error && <div className={styles.error}>{error}</div>}

                {loading ? (
                    <div className={styles.loading}>Loading languages...</div>
                ) : languages.length === 0 ? (
                    <div className={styles.empty}>
                        {searchQuery
                        ? 'No languages found matching your search.'
                        : 'No languages available yet.'}
                    </div>
                ) : (
                    <div className={styles.languagesGrid}>
                        {languages.map((language) => (
                        <LanguageCard key={language.id} language={language} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}