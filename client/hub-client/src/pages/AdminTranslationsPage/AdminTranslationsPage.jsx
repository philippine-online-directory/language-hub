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
    const [languagesLoading, setLanguagesLoading] = useState(true);
    const [filter, setFilter] = useState('UNVERIFIED');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchLanguages = async () => {
            setLanguagesLoading(true);
            try {
                // Fetch all languages for admin
                const result = await languageService.getLanguages(1, 1000);
                const languagesList = result.languages || [];
                setLanguages(languagesList);
                if (languagesList.length > 0) {
                    setSelectedLanguage(languagesList[0].isoCode);
                }
            } catch (err) {
                console.error('Error fetching languages:', err);
            } finally {
                setLanguagesLoading(false);
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
            // Fetch all translations for admin (large limit)
            const result = await languageService.getTranslations(
                selectedLanguage,
                { status: filter, page: 1, limit: 1000 }
            );
            setTranslations(result.translations || []);
        } catch (err) {
            console.error('Error fetching translations:', err);
            setTranslations([]);
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
            <div className={`${styles.adminTranslationsPage} ${mounted ? styles.mounted : ''}`}>
                <div className={styles.backgroundPattern}></div>
                <div className={styles.container}>
                    <div className={styles.unauthorized}>
                        <svg className={styles.unauthorizedIcon} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p>Unauthorized access</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.adminTranslationsPage} ${mounted ? styles.mounted : ''}`}>
            <div className={styles.backgroundPattern}></div>
            
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Verify Translations</h1>
                </header>

                <div className={styles.controls}>
                    <div className={styles.controlGroup}>
                        <label className={styles.label}>Language</label>
                        {languagesLoading ? (
                            <div className={styles.loadingSelect}>Loading languages...</div>
                        ) : (
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
                        )}
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
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Loading translations...</p>
                    </div>
                ) : translations.length === 0 ? (
                    <div className={styles.empty}>
                        <svg className={styles.emptyIcon} viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                        <p>No {filter.toLowerCase()} translations found for this language.</p>
                    </div>
                ) : (
                    <div className={styles.translationsGrid}>
                        {translations.map((translation) => (
                            <div key={translation.id} className={styles.translationItem}>
                                <WordDisplay 
                                    translation={translation} 
                                    showAddToSet={false}
                                    defaultExpanded={false}
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