import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { languageService } from '../../api/languageService';
import { useAuth } from '../../context/AuthContext';
import useDebounce from '../../hooks/useDebounce';
import WordDisplay from '../../components/WordDisplay/WordDisplay';
import Pagination from '../../components/Pagination/Pagination';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import MissingWordsSidebar from '../../components/MissingWordsSidebar/MissingWordsSidebar';
import { clearJsonLd, setJsonLd, setRobotsDirective } from '../../utils/seoMeta';
import styles from './LanguageDetailPage.module.css';

const SORT_OPTIONS = [
    { value: 'alpha-asc',  label: 'A → Z' },
    { value: 'alpha-desc', label: 'Z → A' },
    { value: 'date-desc',  label: 'Newest first' },
    { value: 'date-asc',   label: 'Oldest first' },
];

const STATUS_OPTIONS = [
    { value: 'VERIFIED', label: 'Verified only' },
    { value: 'ALL',      label: 'All entries' },
];

const SEARCH_MODE_OPTIONS = [
    { value: 'text',       label: 'Search by word' },
    { value: 'definition', label: 'Search by definition' },
];

const TRANSLATIONS_PER_PAGE = 20;
const TOTAL_COMMON_WORDS = 2809;

export default function LanguageDetailPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [language,    setLanguage]    = useState(null);
    const [langLoading, setLangLoading] = useState(true);
    const [langError,   setLangError]   = useState(null);

    const [translations,         setTranslations]         = useState([]);
    const [pagination,           setPagination]           = useState(null);
    const [translationsLoading,  setTranslationsLoading]  = useState(true);
    const [translationsError,    setTranslationsError]    = useState(null);
    const [retryCount,           setRetryCount]           = useState(0);


    const [searchQuery,   setSearchQuery]   = useState('');
    const [searchMode,    setSearchMode]    = useState('text');
    const [statusMode,    setStatusMode]    = useState('VERIFIED');
    const [sortBy,        setSortBy]        = useState('alpha-asc');
    const [coreWordsOnly, setCoreWordsOnly] = useState(false);
    const [currentPage,   setCurrentPage]   = useState(1);

    const [translationsOpen, setTranslationsOpen] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    const [mounted, setMounted] = useState(false);
    const debouncedSearch = useDebounce(searchQuery, 400);
    const gridRef = useRef(null);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!langLoading && (langError || !language)) {
            setRobotsDirective('noindex,follow');
        }
    }, [langLoading, langError, language]);

    useEffect(() => {
        if (!language) return;

        const url = `https://www.philippineonlinedictionary.com/languages/${language.slug}`;
        setJsonLd('pod-page-jsonld', {
            '@type': 'DefinedTermSet',
            '@id': `${url}#dictionary`,
            name: `${language.name} Dictionary`,
            url,
            description: language.preservationNote || `Community-built dictionary for ${language.name}.`,
            inLanguage: language.isoCode || undefined,
        });

        return () => clearJsonLd('pod-page-jsonld');
    }, [language]);

    useEffect(() => {
        setCurrentPage(1);
        setExpandedId(null);
    }, [debouncedSearch, searchMode, statusMode, sortBy, coreWordsOnly]);

    useEffect(() => {
        setExpandedId(null);
    }, [currentPage]);

    useEffect(() => {
        let cancelled = false;

        const fetchLanguage = async () => {
            setLangLoading(true);
            setLangError(null);
            try {
                const data = await languageService.getLanguageBySlug(slug);
                if (cancelled) return;
                if (!data) {
                    setLangError('Language not found.');
                } else {
                    setLanguage(data);
                }
            } catch (err) {
                if (cancelled) return;
                if (err.response?.status === 404) {
                    setLangError('Language not found.');
                } else {
                    setLangError('Failed to load language data. Please try again.');
                }
                console.error('Error fetching language:', err);
            } finally {
                if (!cancelled) setLangLoading(false);
            }
        };

        fetchLanguage();
        return () => { cancelled = true; };
    }, [slug]);

    useEffect(() => {
        let cancelled = false;

        const fetchTranslations = async () => {
            setTranslationsLoading(true);
            setTranslationsError(null);
            try {
                const params = {
                    status: statusMode,
                    sortBy,
                    coreWordsOnly,
                    page: currentPage,
                    limit: TRANSLATIONS_PER_PAGE,
                };

                if (debouncedSearch.trim()) {
                    if (searchMode === 'text')       params.text       = debouncedSearch;
                    if (searchMode === 'definition') params.definition = debouncedSearch;
                }

                const result = await languageService.getTranslations(slug, params);
                if (cancelled) return;

                setTranslations(result.translations || []);
                setPagination(result.pagination);

                if (currentPage > 1) {
                    window.scrollTo({ top: 200, behavior: 'smooth' });
                }
            } catch (err) {
                if (cancelled) return;
                setTranslationsError('Failed to load translations. Please try again.');
                console.error('Error fetching translations:', err);
            } finally {
                if (!cancelled) setTranslationsLoading(false);
            }
        };

        fetchTranslations();
        return () => { cancelled = true; };
    }, [slug, debouncedSearch, searchMode, statusMode, sortBy, coreWordsOnly, currentPage, retryCount]);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion || !gridRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add(styles.visible); }),
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );

        const items = gridRef.current.querySelectorAll(`.${styles.animateItem}`);
        items.forEach(item => observer.observe(item));
        return () => observer.disconnect();
    }, [translations, translationsOpen]);

    const handleRetry = useCallback(() => {
        setRetryCount(c => c + 1);
    }, []);

    const handleResetFilters = useCallback(() => {
        setSearchQuery('');
        setSearchMode('text');
        setStatusMode('VERIFIED');
        setSortBy('alpha-asc');
        setCoreWordsOnly(false);
        setCurrentPage(1);
    }, []);

    const handleMissingWordClick = useCallback((word) => {
        const contributeUrl = `/contribute?languageSlug=${slug}&englishWord=${encodeURIComponent(word.word)}&commonWordId=${word.id}`;
        if (isAuthenticated) {
            navigate(contributeUrl);
        } else {
            navigate(`/login?redirect=${encodeURIComponent(contributeUrl)}&intent=contribute`);
        }
    }, [slug, isAuthenticated, navigate]);

    const isFiltered =
        statusMode !== 'VERIFIED' ||
        sortBy !== 'alpha-asc'    ||
        coreWordsOnly             ||
        !!searchQuery.trim();

    const activeFilterCount = [
        statusMode !== 'VERIFIED',
        sortBy !== 'alpha-asc',
        coreWordsOnly,
        !!searchQuery.trim(),
    ].filter(Boolean).length;

    if (langLoading) {
        return (
            <div className={`${styles.languageDetailPage} ${mounted ? styles.mounted : ''}`}>
                <div className={styles.backgroundPattern} />
                <div className={styles.container}>
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner} />
                        <p>Loading language…</p>
                    </div>
                </div>
            </div>
        );
    }

    if (langError || !language) {
        return (
            <div className={`${styles.languageDetailPage} ${mounted ? styles.mounted : ''}`}>
                <div className={styles.backgroundPattern} />
                <div className={styles.container}>
                    <div className={styles.errorCard}>
                        <svg viewBox="0 0 20 20" fill="currentColor" className={styles.errorIcon}>
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p>{langError || 'Language not found.'}</p>
                        <Button variant="secondary" onClick={() => navigate('/languages')}>
                            Back to Languages
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const hasContributors = language.topContributors && language.topContributors.length > 0;
    const completionPct = language.completionCount != null
        ? Math.round(language.completionCount / TOTAL_COMMON_WORDS * 100)
        : null;

    return (
        <div className={`${styles.languageDetailPage} ${mounted ? styles.mounted : ''}`}>
            <div className={styles.backgroundPattern} />

            <div className={styles.container}>

                {}
                <header className={styles.header}>

                    {}
                    <div className={styles.headerContent}>
                        <div className={styles.languageNameRow}>
                            <h1 className={styles.languageName}>{language.name}</h1>
                            {completionPct !== null && (
                                <span className={styles.completionBadge}>{completionPct}% complete</span>
                            )}
                        </div>
                        <div className={styles.meta}>
                            {language.isoCode && <span className={styles.isoCode}>{language.isoCode.toUpperCase()}</span>}
                            {language.speakerCount != null && language.speakerCount > 0 && (
                                <span className={styles.speakerCount}>
                                    {language.speakerCount.toLocaleString()} speakers
                                </span>
                            )}
                        </div>
                        {language.preservationNote && (
                            <p className={styles.preservationNote}>{language.preservationNote}</p>
                        )}
                    </div>

                    {}
                    <div className={styles.headerActions}>
                        <Button variant="primary" onClick={() => navigate('/contribute')}>
                            Contribute Word
                        </Button>
                    </div>

                    {}
                    {hasContributors && (
                        <div className={styles.podiumSection}>
                            <p className={styles.podiumSectionTitle}>🏆 Top Contributors</p>
                            <div className={styles.contributorsPodium}>
                                {(language.topContributors.length >= 3
                                    ? [language.topContributors[1], language.topContributors[0], language.topContributors[2]]
                                    : language.topContributors
                                ).map((contributor) => {
                                    const index = language.topContributors.indexOf(contributor);
                                    const rank = index + 1;
                                    const rankMeta = [
                                        { label: '1st', colorClass: styles.rankGold },
                                        { label: '2nd', colorClass: styles.rankSilver },
                                        { label: '3rd', colorClass: styles.rankBronze },
                                    ][index];

                                    const cardContent = (
                                        <>
                                            <span className={`${styles.rankBadge} ${rankMeta.colorClass}`}>
                                                {rankMeta.label}
                                            </span>
                                            <span className={styles.contributorName}>
                                                {contributor.username}
                                            </span>
                                            <span className={styles.contributorCount}>
                                                {contributor.count} verified {contributor.count === 1 ? 'word' : 'words'}
                                            </span>
                                        </>
                                    );

                                    return contributor.id ? (
                                        <Link
                                            key={contributor.id ?? index}
                                            to={`/profile/${contributor.id}`}
                                            className={`${styles.podiumCard} ${styles[`podiumRank${rank}`]}`}
                                            title={`View ${contributor.username}'s profile`}
                                        >
                                            {cardContent}
                                        </Link>
                                    ) : (
                                        <div
                                            key={index}
                                            className={`${styles.podiumCard} ${styles[`podiumRank${rank}`]} ${styles.podiumCardDeleted}`}
                                        >
                                            {cardContent}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </header>

                {}
                <section className={styles.translationsSection}>

                    {}
                    <div className={styles.sectionHeadingRow}>
                        <h2 className={styles.sectionTitle}>Words &amp; Phrases</h2>
                        {activeFilterCount > 0 && (
                            <button className={styles.resetBtn} onClick={handleResetFilters}>
                                <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Reset filters
                                <span className={styles.filterBadge}>{activeFilterCount}</span>
                            </button>
                        )}
                    </div>

                    {}
                    <div className={styles.controlPanel}>

                        {}
                        <div className={styles.controlRow}>

                            {}
                            <div className={styles.controlGroup}>
                                <label className={styles.controlLabel}>Search by</label>
                                <div className={styles.selectWrapper}>
                                    <select
                                        className={styles.select}
                                        value={searchMode}
                                        onChange={e => { setSearchMode(e.target.value); setSearchQuery(''); }}
                                        aria-label="Search mode"
                                    >
                                        {SEARCH_MODE_OPTIONS.map(o => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                    <svg className={styles.selectChevron} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>

                            {}
                            <div className={styles.controlGroup}>
                                <label className={styles.controlLabel}>Sort</label>
                                <div className={styles.selectWrapper}>
                                    <select
                                        className={`${styles.select} ${sortBy !== 'alpha-asc' ? styles.selectActive : ''}`}
                                        value={sortBy}
                                        onChange={e => setSortBy(e.target.value)}
                                        aria-label="Sort order"
                                    >
                                        {SORT_OPTIONS.map(o => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                    <svg className={styles.selectChevron} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>

                            {}
                            <div className={styles.controlGroup}>
                                <label className={styles.controlLabel}>Status</label>
                                <div className={styles.selectWrapper}>
                                    <select
                                        className={`${styles.select} ${statusMode !== 'VERIFIED' ? styles.selectActive : ''}`}
                                        value={statusMode}
                                        onChange={e => setStatusMode(e.target.value)}
                                        aria-label="Verification status"
                                    >
                                        {STATUS_OPTIONS.map(o => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                    <svg className={styles.selectChevron} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>

                            {}
                            <div className={styles.controlGroup}>
                                <label className={styles.controlLabel}>Core words</label>
                                <label className={`${styles.toggleWrapper} ${coreWordsOnly ? styles.toggleWrapperOn : ''}`}>
                                    <input
                                        type="checkbox"
                                        className={styles.toggleInput}
                                        checked={coreWordsOnly}
                                        onChange={e => setCoreWordsOnly(e.target.checked)}
                                        aria-label="Show core words only"
                                    />
                                    <span className={styles.toggleSlider} />
                                    <span className={styles.toggleText}>
                                        {coreWordsOnly ? 'On' : 'Off'}
                                    </span>
                                </label>
                            </div>
                        </div>

                        {}
                        <div className={styles.searchRow}>
                            <div className={styles.searchInputWrapper}>
                                <Input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder={searchMode === 'text' ? 'Search words…' : 'Search definitions…'}
                                    className={styles.searchInput}
                                />
                                {searchQuery && (
                                    <button
                                        className={styles.clearSearch}
                                        onClick={() => setSearchQuery('')}
                                        aria-label="Clear search"
                                        type="button"
                                    >
                                        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {}
                    <div className={styles.iconLegend}>
                        <div className={styles.legendItem}>
                            <span className={styles.legendCheckmark}>✓</span>
                            <span className={styles.legendText}>Verified translation</span>
                        </div>
                        <div className={styles.legendItem}>
                            <svg className={styles.legendWarning} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            <span className={styles.legendText}>Missing fields — expand the card, then click this icon to fill them in</span>
                        </div>
                        <div className={styles.legendItem}>
                            <svg className={styles.legendHint} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 15l-2 5L9 9l11 4-5 2z" />
                                <path d="M15 15l-2 5L9 9l11 4-5 2z" />
                            </svg>
                            <span className={styles.legendText}>Hover over a card and click "See details" to view translation info</span>
                        </div>
                    </div>

                    {}
                    <div className={styles.columnsGrid}>

                        {}
                        <div className={styles.column}>
                            <div className={styles.columnHeader}>
                                <h3 className={styles.columnTitle}>
                                    Existing Translations
                                    {pagination && <span className={styles.columnCount}>({pagination.total.toLocaleString()})</span>}
                                </h3>
                                <button
                                    className={styles.toggleColBtn}
                                    onClick={() => setTranslationsOpen(o => !o)}
                                    aria-expanded={translationsOpen}
                                >
                                    {translationsOpen ? 'Hide' : 'Show'}
                                </button>
                            </div>

                            {translationsOpen && (
                                <>
                                    {translationsLoading ? (
                                        <div className={styles.colLoadingState}>
                                            <div className={styles.loadingSpinner} />
                                            <p>Loading translations…</p>
                                        </div>
                                    ) : translationsError ? (
                                        <div className={styles.errorCard}>
                                            <svg viewBox="0 0 20 20" fill="currentColor" className={styles.errorIcon}>
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <p>{translationsError}</p>
                                            <Button variant="secondary" onClick={handleRetry}>
                                                Try again
                                            </Button>
                                        </div>
                                    ) : translations.length === 0 ? (
                                        <div className={styles.empty}>
                                            <svg className={styles.emptyIcon} viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                                            </svg>
                                            <p>
                                                {coreWordsOnly && !searchQuery.trim()
                                                    ? 'No core words have been contributed for this language yet.'
                                                    : searchQuery.trim()
                                                        ? `No translations found for "${searchQuery}".`
                                                        : 'No words available yet. Be the first to contribute!'}
                                            </p>
                                            {isFiltered && (
                                                <Button variant="secondary" onClick={handleResetFilters}>
                                                    Reset filters
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className={styles.translationsGrid} ref={gridRef}>
                                                {translations.map((translation, index) => (
                                                    <div
                                                        key={translation.id}
                                                        className={styles.animateItem}
                                                        style={{ '--item-index': index }}
                                                    >
                                                        <WordDisplay
                                                            translation={translation}
                                                            showAddToSet={true}
                                                            expanded={expandedId === translation.id}
                                                            onToggle={setExpandedId}
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            {pagination && pagination.totalPages > 1 && (
                                                <Pagination
                                                    currentPage={currentPage}
                                                    totalPages={pagination.totalPages}
                                                    onPageChange={setCurrentPage}
                                                    totalItems={pagination.total}
                                                    itemsPerPage={pagination.limit}
                                                />
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        <MissingWordsSidebar slug={slug} onWordClick={handleMissingWordClick} />
                    </div>
                </section>
            </div>
        </div>
    );
}
