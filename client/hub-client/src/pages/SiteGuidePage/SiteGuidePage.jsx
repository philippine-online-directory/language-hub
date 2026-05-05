import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button/Button';
import styles from './SiteGuidePage.module.css';

const steps = [
    {
        number: '01',
        title: 'Explore the Dictionaries',
        description: 'Head to the Dictionaries page to see all languages available on the site. Each language has its own dictionary with words contributed by the community.',
        action: { label: 'Go to Dictionaries', to: '/languages' },
    },
    {
        number: '02',
        title: 'Search for a Language',
        description: 'On the Dictionaries page, use the search bar to find a specific language by name or ISO code. Click on any language card to open its dictionary.',
        action: null,
    },
    {
        number: '03',
        title: 'View Existing Translations',
        description: 'Inside a language dictionary, browse all contributed words and their translations. You can search by word, filter by category, and see example sentences.',
        action: null,
    },
    {
        number: '04',
        title: 'Find Missing Common Words',
        description: 'Every language has a list of common words that still need translations. Visit the "Missing Words" section of any language to see what the community needs most.',
        action: null,
    },
    {
        number: '05',
        title: 'Create an Account or Log In',
        description: 'Contributing requires a free account. Register in under a minute — just an email, username, and password. Already have one? Log in and you\'re ready.',
        action: { label: 'Create an Account', to: '/register?intent=contribute' },
    },
    {
        number: '06',
        title: 'Submit a Contribution',
        description: 'Once logged in, go to the Contribute page. Fill in the word, its translation, the language it belongs to, and optionally an example sentence. Submit when ready.',
        action: { label: 'Go to Contribute', to: '/contribute' },
    },
    {
        number: '07',
        title: 'What Happens After You Submit',
        description: 'Your contribution is submitted and appears under "My Words" so you can track it. Admins review submissions before they are published in the public dictionary.',
        action: { label: 'View My Words', to: '/contributions' },
    },
];

export default function SiteGuidePage() {
    const stepsRef = useRef(null);
    const headerRef = useRef(null);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(styles.visible);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );

        if (headerRef.current) observer.observe(headerRef.current);

        if (stepsRef.current) {
            const cards = stepsRef.current.querySelectorAll(`.${styles.stepCard}`);
            cards.forEach(el => observer.observe(el));
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div className={styles.siteGuidePage}>
            <div className={styles.pageHeader} ref={headerRef}>
                <div className={styles.pageHeaderInner}>
                    <span className={styles.badge}>How It Works</span>
                    <h1 className={styles.pageTitle}>Site Guide</h1>
                    <p className={styles.pageSubtitle}>
                        A step-by-step walkthrough of everything you can do on the
                        Philippine Online Dictionary — from browsing to contributing.
                    </p>
                </div>
            </div>

            <div className={styles.container}>
                <div className={styles.steps} ref={stepsRef}>
                    {steps.map((step, i) => (
                        <div key={step.number} className={styles.stepCard} style={{ '--delay': `${i * 0.07}s` }}>
                            <div className={styles.stepNumber}>{step.number}</div>
                            <div className={styles.stepContent}>
                                <h2 className={styles.stepTitle}>{step.title}</h2>
                                <p className={styles.stepDescription}>{step.description}</p>
                                {step.action && (
                                    <Link to={step.action.to} className={styles.stepLink}>
                                        {step.action.label} →
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.callout}>
                    <h2 className={styles.calloutTitle}>Still have questions?</h2>
                    <p className={styles.calloutText}>
                        Check the{' '}
                        <Link to="/about" className={styles.inlineLink}>About page</Link>{' '}
                        or browse the{' '}
                        <Link to="/languages" className={styles.inlineLink}>Dictionaries</Link>{' '}
                        to see the site in action.
                    </p>
                </div>
            </div>
        </div>
    );
}
