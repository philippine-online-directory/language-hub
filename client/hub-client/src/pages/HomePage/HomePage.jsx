import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button/Button';
import styles from './HomePage.module.css';

export default function HomePage(){
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    return (
        <div className={styles.homePage}>
            <div className={styles.container}>
                <section className={styles.hero}>
                    <h1 className={styles.heroTitle}>
                        Preserve endangered languages through shared learning
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Explore words and phrases from languages around the world. 
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
                </section>

                <section className={styles.features}>
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

                <section className={styles.callToAction}>
                    <h2 className={styles.ctaTitle}>
                        You're helping keep languages alive
                    </h2>
                    <p className={styles.ctaDescription}>
                        Join a community dedicated to preserving the world's linguistic diversity. 
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