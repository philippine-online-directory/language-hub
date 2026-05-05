import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useRef } from 'react';
import Button from '../../components/Button/Button';
import Translator from '../../components/Translator/Translator';
import styles from './HomePage.module.css';

export default function HomePage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const translatorRef = useRef(null);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion || !translatorRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(styles.visible);
                    } else {
                        entry.target.classList.remove(styles.visible);
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px' }
        );

        observer.observe(translatorRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div className={styles.homePage}>
            <section className={styles.hero}>
                <div className={styles.heroMapWrapper}>
                    <img
                        src="/philippines.svg"
                        alt=""
                        aria-hidden="true"
                        className={styles.heroMap}
                    />
                </div>
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
                                    onClick={() => navigate('/login')}
                                >
                                    Login or register to contribute
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <div className={styles.container}>
                <section className={styles.translatorSection} ref={translatorRef}>
                    <div className={styles.translatorSectionHeader}>
                        <h2 className={styles.translatorTitle}>Try the Translator</h2>
                        <p className={styles.translatorSubtitle}>
                            Look up a single word across Philippine languages, powered entirely by community contributions.
                        </p>
                    </div>
                    <Translator compact />
                </section>
            </div>
        </div>
    );
}
