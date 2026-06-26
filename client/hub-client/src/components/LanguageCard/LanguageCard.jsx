import { Link } from 'react-router-dom';
import Card from '../Card/Card';
import styles from './LanguageCard.module.css';

const TOTAL_COMMON_WORDS = 2809;

export default function LanguageCard({ language }){
    const percent = Math.min(
        (language.completionCount / TOTAL_COMMON_WORDS) * 100,
        100
    );

    return (
        <Link to={`/languages/${language.slug}`} className={styles.languageLink}>
            <Card hoverable={true} className={styles.languageCard}>
                <h3 className={styles.languageName}>{language.name}</h3>

                <div className={styles.meta}>
                    {language.isoCode && <span className={styles.isoCode}>{language.isoCode.toUpperCase()}</span>}
                    {language.speakerCount > 0 && (
                        <span className={styles.speakerCount}>
                            {language.speakerCount.toLocaleString()} speakers
                        </span>
                    )}
                </div>

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

            </Card>
        </Link>
    ) 
}
