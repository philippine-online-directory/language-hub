import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useEffect, useRef } from 'react';
import Button from '../../components/Button/Button';
import styles from './AboutPage.module.css';

export default function AboutPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const featuresRef = useRef(null);
    const ctaRef = useRef(null);
    const teamRef = useRef(null);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const observerOptions = { threshold: 0.15, rootMargin: '0px' };

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

        if (teamRef.current) {
            const teamElements = teamRef.current.querySelectorAll(`.${styles.teamMember}`);
            teamElements.forEach(el => observer.observe(el));
        }

        if (featuresRef.current) {
            const featureElements = featuresRef.current.querySelectorAll(`.${styles.feature}`);
            featureElements.forEach(el => observer.observe(el));
        }

        if (ctaRef.current) {
            observer.observe(ctaRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div className={styles.aboutPage}>
            <div className={styles.pageHeader}>
                <div className={styles.pageHeaderInner}>
                    <h1 className={styles.pageTitle}>Our Mission</h1>
                    <p className={styles.pageSubtitle}>
                        The Philippines is home to over <strong>180 languages</strong> — many of them endangered,
                        underdocumented, and at risk of disappearing within a generation.
                        We built this dictionary to do something about that.
                    </p>
                </div>
            </div>

            <div className={styles.container}>
                <section className={styles.team} ref={teamRef}>
                    <div className={styles.teamLabel}>The People Behind This</div>
                    <div className={styles.teamGrid}>
                        <div className={styles.teamMember}>
                            <div className={styles.memberAvatar}>D</div>
                            <div className={styles.memberName}>Daniel Guirao</div>
                            <div className={styles.memberTitle}>Co-Founder &amp; Technical Lead</div>
                            <p className={styles.memberBio}>
                                Daniel Guirao is a student, Co-Founder, and technical lead 
                                behind the initiative. He developed much of the platform&apos;s 
                                full-stack infrastructure and core technical systems, leading 
                                the architecture, implementation, and ongoing maintenance of the 
                                Philippine Online Dictionary. Daniel also coordinates and guides 
                                the software engineering team, overseeing technical execution and 
                                helping ensure the platform continues to evolve in support of the initiative&apos;s mission.
                            </p>
                        </div>
                        <div className={styles.teamMember}>
                            <div className={styles.memberAvatar}>J</div>
                            <div className={styles.memberName}>Jong Navarro</div>
                            <div className={styles.memberTitle}>Co-Founder &amp; Head of Outreach and Operations</div>
                            <p className={styles.memberBio}>
                                Jong Navarro is a Co-Founder who leads the initiative&apos;s outreach, 
                                partnerships, and operational coordination efforts. He works closely 
                                with organizations, community stakeholders, testers, and local collaborators 
                                to ensure the platform is shaped by the needs of the people and communities 
                                it is designed to serve. Jong also helps coordinate communications and collaboration 
                                across different parts of the initiative to support its continued growth and impact.
                            </p>
                        </div>
                    </div>
                </section>

                <section className={styles.features} ref={featuresRef}>
                    <div className={styles.feature}>
                        <h2 className={styles.featureTitle}>Why It Matters</h2>
                        <p className={styles.featureDescription}>
                            When a language disappears, so does an entire way of seeing the world — its stories,
                            concepts, and cultural knowledge. Many Philippine minority languages have few written
                            records and no digital presence. We exist to change that.
                        </p>
                    </div>

                    <div className={styles.feature}>
                        <h2 className={styles.featureTitle}>Community-Powered Preservation</h2>
                        <p className={styles.featureDescription}>
                            No single institution can document every language. That's why this dictionary is
                            built by the people who speak them — native speakers, researchers, diaspora communities,
                            and language enthusiasts contributing word by word.
                        </p>
                    </div>

                    <div className={styles.feature}>
                        <h2 className={styles.featureTitle}>Free and Open</h2>
                        <p className={styles.featureDescription}>
                            Everything here is freely accessible. Whether you're a student reconnecting with
                            your heritage, a researcher documenting a language, or simply curious about the
                            Philippines' linguistic richness — this resource is for you.
                        </p>
                    </div>
                </section>

                <section className={styles.callToAction} ref={ctaRef}>
                    <h2 className={styles.ctaTitle}>
                        Every word you share keeps a language alive
                    </h2>
                    <p className={styles.ctaDescription}>
                        Join a growing community dedicated to preserving the Philippines' linguistic heritage.
                        Contribute a translation, fill in a missing word, or simply spread the word.
                        Small contributions add up to something lasting.
                    </p>
                    {!isAuthenticated && (
                        <Button
                            variant="primary"
                            onClick={() => navigate('/register')}
                        >
                            Join the Community
                        </Button>
                    )}
                </section>
            </div>
        </div>
    );
}
