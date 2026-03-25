import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useRef } from 'react';
import Button from '../../components/Button/Button';
import Translator from '../../components/Translator/Translator';
import styles from './HomePage.module.css';

export default function HomePage(){
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const featuresRef = useRef(null);
    const ctaRef = useRef(null);
    const translatorRef = useRef(null);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px'
        };

        const observerCallback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(styles.visible);
                } else {
                    entry.target.classList.remove(styles.visible);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        // Observe features
        if (featuresRef.current) {
            const featureElements = featuresRef.current.querySelectorAll(`.${styles.feature}`);
            featureElements.forEach(el => observer.observe(el));
        }

        // Observe CTA
        if (ctaRef.current) {
            observer.observe(ctaRef.current);
        }

        // Observe translator section
        if (translatorRef.current) {
            observer.observe(translatorRef.current);
        }

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
                            Preserve endangered languages through shared learning
                        </h1>
                        <p className={styles.heroSubtitle}>
                            Explore words and phrases from languages around the <strong>Philippines</strong>. 
                            Contribute translations, build vocabulary sets, and help keep 
                            linguistic diversity alive.
                        </p>
                        <div className={styles.heroActions}>
                            {isAuthenticated ? (
                                <>
                                    <Button 
                                        variant="primary" 
                                        onClick={() => navigate('/languages')}
                                    >
                                        Explore Languages
                                    </Button>
                                    <Button 
                                        variant="secondary" 
                                        onClick={() => navigate('/contribute')}
                                    >
                                        Contribute
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button 
                                        variant="primary" 
                                        onClick={() => navigate('/register')}
                                    >
                                        Get Started
                                    </Button>
                                    <Button 
                                        variant="secondary" 
                                        onClick={() => navigate('/languages')}
                                    >
                                        Browse Languages
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <div className={styles.container}>
                <section className={styles.features} ref={featuresRef}>
                    <div className={styles.feature}>
                        <h2 className={styles.featureTitle}>Explore</h2>
                        <p className={styles.featureDescription}>
                            Discover words and phrases from endangered and minority 
                            languages, complete with pronunciation guides and cultural context.
                        </p>
                    </div>

                    <div className={styles.feature}>
                        <h2 className={styles.featureTitle}>Contribute</h2>
                        <p className={styles.featureDescription}>
                            Share your knowledge by contributing translations, recordings, 
                            and example sentences. Every contribution helps preserve linguistic heritage.
                        </p>
                    </div>

                    <div className={styles.feature}>
                        <h2 className={styles.featureTitle}>Learn</h2>
                        <p className={styles.featureDescription}>
                            Create custom vocabulary sets and practice with interactive games. 
                            Make language preservation part of your learning journey.
                        </p>
                    </div>
                </section>

                {/* Translator Section */}
                <section className={styles.translatorSection} ref={translatorRef}>
                    <div className={styles.translatorSectionHeader}>
                        <h2 className={styles.translatorTitle}>Try the Translator</h2>
                        <p className={styles.translatorSubtitle}>
                            Look up a single word across Philippine languages, powered entirely by community contributions.
                        </p>
                    </div>
                    <Translator compact />
                    <div className={styles.translatorFooter}>
                        <button className={styles.translatorLink} onClick={() => navigate('/translate')}>
                            Open full translator
                            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </section>

                <section className={styles.callToAction} ref={ctaRef}>
                    <h2 className={styles.ctaTitle}>
                        You're helping keep languages alive
                    </h2>
                    <p className={styles.ctaDescription}>
                        Join a community dedicated to preserving the Philippines' linguistic diversity. 
                        Every word shared is a step toward cultural preservation.
                    </p>
                    {!isAuthenticated && (
                        <Button 
                            variant="primary" 
                            onClick={() => navigate('/register')}
                        >
                            Join Now
                        </Button>
                    )}
                </section>
            </div>
        </div>
    );
}