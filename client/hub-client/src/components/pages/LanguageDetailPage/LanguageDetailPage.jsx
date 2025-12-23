import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { languageService } from '../../api/languageService';
import WordDisplay from '../../components/WordDisplay/WordDisplay';
import Button from '../../components/Button/Button';
import styles from './LanguageDetailPage.module.css';


export default function LanguageDetailPage(){
    const { isoCode } = useParams();
    const [language, setLanguage] = useState(null);
    const [translations, setTranslations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLanguageData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [langData, transData] = await Promise.all([
                    languageService.getLanguageByCode(isoCode),
                    languageService.getTranslations(isoCode),
                ]);
                setLanguage(langData);
                setTranslations(transData);
            } 
            catch (err) {
                setError('Failed to load language data. Please try again.');
                console.error('Error fetching language data:', err);
            } 
            finally {
                setLoading(false);
            }
        };

        fetchLanguageData();
    }, [isoCode]);

    if (loading) {
        return (
            <div className={styles.languageDetailPage}>
                <div className={styles.container}>
                    <div className={styles.loading}>Loading...</div>
                </div>
            </div>
        );
    }

    if (error || !language) {
        return (
            <div className={styles.languageDetailPage}>
                <div className={styles.container}>
                    <div className={styles.error}>{error || 'Language not found'}</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.languageDetailPage}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.languageName}>{language.name}</h1>
                        <div className={styles.meta}>
                            <span className={styles.isoCode}>{language.isoCode.toUpperCase()}</span>
                            {language.speakerCount !== null && (
                                <span className={styles.speakerCount}>
                                    {language.speakerCount.toLocaleString()} speakers
                                </span>
                            )}
                        </div>
                        {language.preservationNote && (
                        <p className={styles.preservationNote}>{language.preservationNote}</p>
                        )}
                    </div>
                    <Button variant="primary">Contribute Word</Button>
                </header>

                <section className={styles.translationsSection}>
                    <h2 className={styles.sectionTitle}>Words & Phrases</h2>
                    
                    {translations.length === 0 ? (
                        <div className={styles.empty}>
                            No words available yet. Be the first to contribute!
                        </div>
                    ) : (
                        <div className={styles.translationsGrid}>
                            {translations.map((translation) => (
                                <WordDisplay key={translation.id} translation={translation} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}