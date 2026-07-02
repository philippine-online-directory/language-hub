import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import Button from '../../components/Button/Button';
import Translator from '../../components/Translator/Translator';
import styles from './HomePage.module.css';

export default function HomePage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    return (
        <div className={styles.homePage}>
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <div className={styles.heroTextWrapper}>
                        <h1 className={styles.heroTitle}>
                            Philippine Online Dictionary
                        </h1>
                        <p className={styles.heroSubtitle}>
                            Preserve endangered languages through shared learning.
                            Explore words from languages across the <strong>Philippines</strong>.
                        </p>
                        <div className={styles.heroActions}>
                            <Button
                                variant="primary"
                                onClick={() => navigate('/languages')}
                            >
                                Explore Dictionaries
                            </Button>
                            {isAuthenticated ? (
                                <Button
                                    variant="secondary"
                                    onClick={() => navigate('/contribute')}
                                >
                                    Contribute here
                                </Button>
                            ) : (
                                <Button
                                    variant="secondary"
                                    onClick={() => navigate('/login?redirect=/contribute&intent=contribute')}
                                >
                                    Contribute to a dictionary
                                </Button>
                            )}
                        </div>
                    </div>
                    <section className={styles.translatorSection}>
                        <div className={styles.translatorSectionHeader}>
                            <h2 className={styles.translatorTitle}>Try the Translator</h2>
                            <p className={styles.translatorSubtitle}>
                                Look up a single word across Philippine languages, powered entirely by community contributions.
                            </p>
                        </div>
                        <Translator compact />
                    </section>
                </div>
            </section>
        </div>
    );
}
