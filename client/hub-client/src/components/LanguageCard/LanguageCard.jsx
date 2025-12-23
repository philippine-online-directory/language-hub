import { useNavigate } from 'react-router-dom';
import Card from '../Card/Card';
import styles from './LanguageCard.module.css';

export default function LanguageCard({ language }){
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/languages/${language.isoCode}`);
    };

    <Card onClick={handleClick} hoverable={true} className={styles.LanguageCard}>
        <h3 className={styles.languageName}>{language.name}</h3>
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
    </Card>
}