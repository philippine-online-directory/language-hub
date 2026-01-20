import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { languageService } from '../../api/languageService';
import Button from '../../components/Button/Button';
import WordDisplay from '../../components/WordDisplay/WordDisplay';
import styles from './AdminTranslationsPage.module.css';

export default function AdminTranslationsPage(){
    const { user } = useAuth();
    const [languages, setLanguages] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [translations, setTranslations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('UNVERIFIED');

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const data = await languageService.getLanguages();
                setLanguages(data);
                if (data.length > 0) {
                    setSelectedLanguage(data[0].isoCode);
                }
            } catch (err) {
                console.error('Error fetching languages:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLanguages();
    }, []);

    useEffect(() => {
        if (selectedLanguage) {
            fetchTranslations();
        }
    }, [selectedLanguage, filter]);

    const fetchTranslations = async () => {
        setLoading(true);
        try {
            const data = await languageService.getTranslations(
                selectedLanguage,
                { status: filter }
            );
            setTranslations(data);
        } catch (err) {
            console.error('Error fetching translations:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (translationId) => {
        try {
            await languageService.updateTranslationStatus(
                selectedLanguage,
                translationId,
                'VERIFIED'
            );
            await fetchTranslations();
        } catch (err) {
            alert('Failed to verify translation');
            console.error('Error verifying translation:', err);
        }
    };

    const handleUnverify = async (translationId) => {
        try {
            await languageService.updateTranslationStatus(
                selectedLanguage,
                translationId,
                'UNVERIFIED'
            );
            await fetchTranslations();
        } catch (err) {
            alert('Failed to update translation');
            console.error('Error updating translation:', err);
        }
    };

    if (user?.role !== 'ADMIN') {
        return (
            <div className={styles.adminTranslationsPage}>
                <div className={styles.container}>
                    <div className={styles.unauthorized}>Unauthorized access</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.adminTranslationsPage}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Verify Translations</h1>
                </header>

                <div className={styles.controls}>
                    <div className={styles.controlGroup}>
                        <label className={styles.label}>Language</label>
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className={styles.select}
                        >
                            {languages.map((lang) => (
                                <option key={lang.isoCode} value={lang.isoCode}>
                                    {lang.name} ({lang.isoCode.toUpperCase()})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.radioLabel}>
                            <input
                                type="radio"
                                value="UNVERIFIED"
                                checked={filter === 'UNVERIFIED'}
                                onChange={(e) => setFilter(e.target.value)}
                                className={styles.radio}
                            />
                            <span>Unverified</span>
                        </label>
                        <label className={styles.radioLabel}>
                            <input
                                type="radio"
                                value="VERIFIED"
                                checked={filter === 'VERIFIED'}
                                onChange={(e) => setFilter(e.target.value)}
                                className={styles.radio}
                            />
                            <span>Verified</span>
                        </label>
                        <label className={styles.radioLabel}>
                            <input
                                type="radio"
                                value="ALL"
                                checked={filter === 'ALL'}
                                onChange={(e) => setFilter(e.target.value)}
                                className={styles.radio}
                            />
                            <span>All</span>
                        </label>
                    </div>
                </div>

                {loading ? (
                    <div className={styles.loading}>Loading translations...</div>
                ) : translations.length === 0 ? (
                    <div className={styles.empty}>
                        No {filter.toLowerCase()} translations found for this language.
                    </div>
                ) : (
                    <div className={styles.translationsGrid}>
                        {translations.map((translation) => (
                            <div key={translation.id} className={styles.translationItem}>
                                <WordDisplay 
                                    translation={translation} 
                                    showAddToSet={false}
                                />
                                <div className={styles.adminActions}>
                                    {translation.status === 'UNVERIFIED' ? (
                                        <Button
                                            variant="primary"
                                            onClick={() => handleVerify(translation.id)}
                                        >
                                            Verify Translation
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            onClick={() => handleUnverify(translation.id)}
                                        >
                                            Mark as Unverified
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}