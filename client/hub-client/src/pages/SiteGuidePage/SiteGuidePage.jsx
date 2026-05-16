import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './SiteGuidePage.module.css';

const guideSections = [
    {
        id: 'explore',
        navLabel: 'Explore',
        eyebrow: 'Browse the Dictionary',
        title: 'Explore Languages and Translations',
        description: 'Start by finding a language, opening its dictionary, and browsing the community-built translations already on the site.',
        steps: [
            {
                number: '01',
                title: 'Explore the Dictionaries',
                description: 'Visit the Dictionaries page to see all of the languages currently available on the site. Each language has its own dictionary powered by community contributions.',
                action: { label: 'Go to Dictionaries', to: '/languages' },
            },
            {
                number: '02',
                title: 'Search for a Language',
                description: 'Use the search bar to find a specific language by name or ISO code, then open the language card you want to explore further.',
            },
            {
                number: '03',
                title: 'View Existing Translations',
                description: 'Inside a language dictionary, browse contributed words and translations, search for terms, and review the details attached to each entry.',
            },
        ],
    },
    {
        id: 'contribute',
        navLabel: 'Contribute',
        eyebrow: 'Join the Community',
        title: 'Contribute New Words',
        description: 'Once you are ready to help preserve a language, create an account and submit a translation for review.',
        steps: [
            {
                number: '07',
                title: 'Create an Account or Log In',
                description: 'Contributing requires a free account. Register with your email, username, and password, or sign in if you already have an account.',
                action: { label: 'Create an Account', to: '/register?intent=contribute' },
            },
            {
                number: '08',
                title: 'Submit a Contribution',
                description: 'Go to the Contribute page, choose the language, enter the word and translation, and add any extra details you have before submitting.',
                action: { label: 'Go to Contribute', to: '/contribute' },
            },
            {
                number: '09',
                title: 'Track What Happens Next',
                description: 'After you submit, your contribution appears under My Words so you can follow its status while admins review it for publication.',
                action: { label: 'View My Words', to: '/contributions' },
            },
        ],
    },
    {
        id: 'reading-entries',
        navLabel: 'Reading Entries',
        eyebrow: 'Understanding the Dictionary',
        title: 'Reading Word Entries',
        description: 'Each word card in a language dictionary shows icons that tell you its status and what you can do with it.',
        steps: [
            {
                number: '04',
                title: 'The Checkmark (✓) — Verified Translation',
                description: 'A green checkmark means the translation has been reviewed and verified by an admin. Verified entries are shown by default when you browse a language dictionary.',
            },
            {
                number: '05',
                title: 'The Alert Symbol (⚠) — Missing Fields',
                description: 'A yellow warning triangle means the entry is missing optional details like a pronunciation guide, audio, or example sentence. Expand the card by clicking it, then click the warning icon to fill in those missing fields and improve the entry.',
            },
            {
                number: '06',
                title: 'Expanding a Card',
                description: 'Click any word card to expand it and see its full details. Once expanded, the alert icon becomes active — click it to see exactly which fields are missing and contribute them directly.',
            },
        ],
    },
    {
        id: 'sets-games',
        navLabel: 'Sets & Games',
        eyebrow: 'Study and Practice',
        title: 'Create Sets and Play Games',
        description: 'Sets let you organize translations into collections, then practice them through interactive games whether the set is your own or public.',
        steps: [
            {
                number: '10',
                title: 'Open the Sets & Games Tab',
                description: 'Use the Sets & Games tab in the navbar to enter the vocabulary sets area of the site. To play games, you need to open a set first — either one you created or a public one.',
                action: { label: 'Go to Sets & Games', to: '/sets' },
            },
            {
                number: '11',
                title: 'Create Your Own Sets or Browse Public Sets',
                description: 'From the Sets & Games page, logged-in users can switch between My Sets and Public Sets to create a new collection or explore sets made by other users.',
                action: { label: 'Browse Sets', to: '/sets' },
            },
            {
                number: '12',
                title: 'Add Translations to a Set',
                description: 'After creating a set, add translations to it from dictionary entries so the set becomes a focused study collection for that language.',
            },
            {
                number: '13',
                title: 'Open a Set and Play Games',
                description: 'Open any set to launch games like flashcards, matching, and writing. Games are only available from inside a set — your own or a public one.',
            },
        ],
    },
];

export default function SiteGuidePage() {
    const headerRef = useRef(null);
    const navRef = useRef(null);
    const contentRef = useRef(null);
    const sectionRefs = useRef({});
    const [activeSection, setActiveSection] = useState(guideSections[0].id);

    const setSectionRef = (sectionId) => (node) => {
        if (node) {
            sectionRefs.current[sectionId] = node;
            return;
        }

        delete sectionRefs.current[sectionId];
    };

    const scrollToSection = (sectionId) => {
        const section = sectionRefs.current[sectionId];
        if (!section) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const navbarOffset = 104;
        const top = section.getBoundingClientRect().top + window.scrollY - navbarOffset;

        window.scrollTo({
            top,
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
    };

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(styles.visible);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );

        const animatedElements = [
            headerRef.current,
            navRef.current,
            ...Object.values(sectionRefs.current),
            ...(contentRef.current?.querySelectorAll(`.${styles.stepCard}`) ?? []),
            contentRef.current?.querySelector(`.${styles.callout}`),
        ].filter(Boolean);

        animatedElements.forEach((element) => observer.observe(element));

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const sections = Object.entries(sectionRefs.current);
        if (sections.length === 0) return undefined;

        const observer = new IntersectionObserver(
            (entries) => {
                const visibleEntries = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((entryA, entryB) => entryB.intersectionRatio - entryA.intersectionRatio);

                if (visibleEntries.length > 0) {
                    setActiveSection(visibleEntries[0].target.dataset.sectionId);
                }
            },
            {
                threshold: [0.2, 0.35, 0.55],
                rootMargin: '-18% 0px -45% 0px',
            }
        );

        sections.forEach(([, element]) => observer.observe(element));

        return () => observer.disconnect();
    }, []);

    return (
        <div className={styles.siteGuidePage}>
            <div className={styles.pageHeader} ref={headerRef}>
                <div className={styles.pageHeaderInner}>
                    <span className={styles.badge}>How It Works</span>
                    <h1 className={styles.pageTitle}>Site Guide</h1>
                    <p className={styles.pageSubtitle}>
                        A guided walkthrough of how to explore dictionaries, contribute translations,
                        build vocabulary sets, and practice with games.
                    </p>
                </div>
            </div>

            <div className={styles.layout}>
                <aside className={styles.sectionNav} ref={navRef}>
                    <p className={styles.sectionNavLabel}>On this page</p>
                    <div className={styles.sectionNavLinks}>
                        {guideSections.map((section) => (
                            <button
                                key={section.id}
                                type="button"
                                className={`${styles.sectionNavLink} ${activeSection === section.id ? styles.sectionNavLinkActive : ''}`}
                                onClick={() => scrollToSection(section.id)}
                            >
                                <span className={styles.sectionNavLinkText}>{section.navLabel}</span>
                                <span className={styles.sectionNavLinkArrow}>↘</span>
                            </button>
                        ))}
                    </div>
                </aside>

                <div className={styles.content} ref={contentRef}>
                    {guideSections.map((section) => (
                        <section
                            key={section.id}
                            id={section.id}
                            data-section-id={section.id}
                            ref={setSectionRef(section.id)}
                            className={styles.sectionBlock}
                        >
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionEyebrow}>{section.eyebrow}</span>
                                <h2 className={styles.sectionTitle}>{section.title}</h2>
                                <p className={styles.sectionDescription}>{section.description}</p>
                            </div>

                            <div className={styles.steps}>
                                {section.steps.map((step, index) => (
                                    <article
                                        key={step.number}
                                        className={styles.stepCard}
                                        style={{ '--delay': `${index * 0.08}s` }}
                                    >
                                        <div className={styles.stepNumber}>{step.number}</div>
                                        <div className={styles.stepContent}>
                                            <h3 className={styles.stepTitle}>{step.title}</h3>
                                            <p className={styles.stepDescription}>{step.description}</p>
                                            {step.action && (
                                                <Link to={step.action.to} className={styles.stepLink}>
                                                    {step.action.label} →
                                                </Link>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    ))}

                    <div className={styles.callout}>
                        <h2 className={styles.calloutTitle}>Need a place to start?</h2>
                        <p className={styles.calloutText}>
                            Browse the <Link to="/languages" className={styles.inlineLink}>Dictionaries</Link>,
                            try the <Link to="/translate" className={styles.inlineLink}>Translator</Link>,
                            or open <Link to="/sets" className={styles.inlineLink}>Sets</Link> to see the study tools in action.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
