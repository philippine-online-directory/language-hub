import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { languageService } from '../../api/languageService';
import useDebounce from '../../hooks/useDebounce';
import WordDisplay from '../../components/WordDisplay/WordDisplay';
import Pagination from '../../components/Pagination/Pagination';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
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

export default function LanguageDetailPage() {
    const { isoCode } = useParams();
    const navigate = useNavigate();

    
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

    
    const [pillOpen, setPillOpen] = useState(false);

    const [mounted, setMounted] = useState(false);
    const debouncedSearch = useDebounce(searchQuery, 400);
    const gridRef = useRef(null);

    
    useEffect(() => { setMounted(true); }, []);

    
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, searchMode, statusMode, sortBy, coreWordsOnly]);

    
    useEffect(() => {
        let cancelled = false;

        const fetchLanguage = async () => {
            setLangLoading(true);
            setLangError(null);
            try {
                const data = await languageService.getLanguageByCode(isoCode);
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
    }, [isoCode]);

    
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

                const result = await languageService.getTranslations(isoCode, params);
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
    }, [isoCode, debouncedSearch, searchMode, statusMode, sortBy, coreWordsOnly, currentPage, retryCount]);

    
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
    }, [translations]);

    
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

    
    return (
        <div className={`${styles.languageDetailPage} ${mounted ? styles.mounted : ''}`}>
            <div className={styles.backgroundPattern} />

            <div className={styles.container}>

                {}
                <header className={styles.header}>

                    {}
                    <div className={styles.headerContent}>
                        <h1 className={styles.languageName}>{language.name}</h1>
                        <div className={styles.meta}>
                            <span className={styles.isoCode}>{language.isoCode.toUpperCase()}</span>
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
                        {hasContributors && (
                            <button
                                className={`${styles.contributorsPill} ${pillOpen ? styles.contributorsPillOpen : ''}`}
                                onClick={() => setPillOpen(o => !o)}
                                aria-expanded={pillOpen}
                                aria-controls="contributors-drawer"
                            >
                                <span className={styles.pillTrophy}>🏆</span>
                                Top Contributors
                                <svg
                                    className={styles.pillChevron}
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                        <Button variant="primary" onClick={() => navigate('/contribute')}>
                            Contribute Word
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => navigate(`/languages/${isoCode}/missing-words`)}
                        >
                            Missing Core Words
                        </Button>
                    </div>

                    {}
                    {hasContributors && (
                        <div className={`${styles.podiumDrawerWrap} ${pillOpen ? styles.podiumDrawerWrapOpen : ''}`}>
                            <div
                                id="contributors-drawer"
                                className={`${styles.podiumDrawer} ${pillOpen ? styles.podiumDrawerOpen : ''}`}
                            >
                                <div className={styles.podiumDrawerInner}>
                                    <div className={`${styles.contributorsPodium} ${styles[`podiumCount${language.topContributors.length}`]}`}>
                                        {language.topContributors.map((contributor, index) => {
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
                    {translationsLoading ? (
                        <div className={styles.loadingState}>
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
                            <p className={styles.resultCount}>
                                {pagination?.total.toLocaleString()} {pagination?.total === 1 ? 'word' : 'words'} found
                                {searchQuery.trim() ? ` for "${searchQuery}"` : ''}
                            </p>

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
                                            defaultExpanded={false}
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
                </section>
            </div>
        </div>
    );
}
