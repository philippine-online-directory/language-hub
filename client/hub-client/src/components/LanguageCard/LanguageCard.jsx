import { useNavigate } from 'react-router-dom';
import Card from '../Card/Card';
import styles from './LanguageCard.module.css';

const TOTAL_COMMON_WORDS = 2809;

export default function LanguageCard({ language }){
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/languages/${language.isoCode}`);
    };

    const percent = Math.min(
        (language.completionCount / TOTAL_COMMON_WORDS) * 100,
        100
    );

    return (
        <Card onClick={handleClick} hoverable={true} className={styles.languageCard}>
            <h3 className={styles.languageName}>{language.name}</h3>

            <div className={styles.meta}>
                <span className={styles.isoCode}>{language.isoCode.toUpperCase()}</span>
                {language.speakerCount !== null && (
                    <span className={styles.speakerCount}>
                        {language.speakerCount.toLocaleString()} speakers
                    </span>
                )}
            </div>

            {/* NEW PROGRESS BAR */}
            <div className={styles.progressWrapper}>
                <div className={styles.progressHeader}>
                    <span>
                        {language.completionCount} / {TOTAL_COMMON_WORDS} core words
                    </span>
                    <span>{Math.round(percent)}%</span>
                </div>

                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>

            {language.preservationNote && (
                <p className={styles.preservationNote}>{language.preservationNote}</p>
            )}
            {language.culturalBackground && (
                <p className={styles.culturalBackground}>{language.culturalBackground}</p>
            )}
        </Card>
    ) 
}