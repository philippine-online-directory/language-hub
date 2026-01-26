import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { languageService } from '../../api/languageService';
import useDebounce from '../../hooks/useDebounce';
import WordDisplay from '../../components/WordDisplay/WordDisplay';
import Pagination from '../../components/Pagination/Pagination';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import styles from './LanguageDetailPage.module.css';

export default function LanguageDetailPage() {
  const { isoCode } = useParams();
  const navigate = useNavigate();

  const [language, setLanguage] = useState(null);
  const [translations, setTranslations] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [loading, setLoading] = useState(true);
  const [translationsLoading, setTranslationsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  // search UI
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('text'); // 'text' | 'definition'
  const [statusMode, setStatusMode] = useState('VERIFIED'); // 'VERIFIED' | 'ALL'
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearch = useDebounce(searchQuery, 400);
  const gridRef = useRef(null);
  const TRANSLATIONS_PER_PAGE = 20;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, searchMode, statusMode]);

  // fetch language metadata once per isoCode
  useEffect(() => {
    const fetchLanguage = async () => {
      setLoading(true);
      setError(null);

      try {
        const langData = await languageService.getLanguageByCode(isoCode);
        setLanguage(langData);
      } catch (err) {
        setError('Failed to load language data. Please try again.');
        console.error('Error fetching language:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLanguage();
  }, [isoCode]);

  // fetch translations whenever search/status/page changes
  useEffect(() => {
    const fetchTranslations = async () => {
      setTranslationsLoading(true);
      setError(null);

      try {
        const params = { 
          status: statusMode,
          page: currentPage,
          limit: TRANSLATIONS_PER_PAGE
        };

        if (debouncedSearch) {
          if (searchMode === 'text') params.text = debouncedSearch;
          if (searchMode === 'definition') params.definition = debouncedSearch;
        }

        const result = await languageService.getTranslations(isoCode, params);
        setTranslations(result.translations || []);
        setPagination(result.pagination);

        if (currentPage > 1) {
          window.scrollTo({ top: 200, behavior: 'smooth' });
        }
      } catch (err) {
        setError('Failed to load translations. Please try again.');
        console.error('Error fetching translations:', err);
      } finally {
        setTranslationsLoading(false);
      }
    };

    fetchTranslations();
  }, [isoCode, debouncedSearch, searchMode, statusMode, currentPage]);

  // Scroll animation observer
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !gridRef.current) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.visible);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    const items = gridRef.current.querySelectorAll(`.${styles.animateItem}`);
    items.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, [translations]);

  if (loading) {
    return (
      <div className={`${styles.languageDetailPage} ${mounted ? styles.mounted : ''}`}>
        <div className={styles.backgroundPattern}></div>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading language...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !language) {
    return (
      <div className={`${styles.languageDetailPage} ${mounted ? styles.mounted : ''}`}>
        <div className={styles.backgroundPattern}></div>
        <div className={styles.container}>
          <div className={styles.error}>{error || 'Language not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.languageDetailPage} ${mounted ? styles.mounted : ''}`}>
      <div className={styles.backgroundPattern}></div>
      
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.languageName}>{language.name}</h1>

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
          </div>

          <Button variant="primary" onClick={() => navigate('/contribute')}>
            Contribute Word
          </Button>
        </header>

        <section className={styles.translationsSection}>
          <div className={styles.translationsHeaderRow}>
            <h2 className={styles.sectionTitle}>Words & Phrases</h2>

            {/* Search controls */}
            <div className={styles.searchControls}>
              <div className={styles.radioRow}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="searchMode"
                    value="text"
                    checked={searchMode === 'text'}
                    onChange={(e) => {
                      setSearchMode(e.target.value);
                      setSearchQuery('');
                    }}
                    className={styles.radio}
                  />
                  <span>Search by Word</span>
                </label>

                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="searchMode"
                    value="definition"
                    checked={searchMode === 'definition'}
                    onChange={(e) => {
                      setSearchMode(e.target.value);
                      setSearchQuery('');
                    }}
                    className={styles.radio}
                  />
                  <span>Search by Definition</span>
                </label>
              </div>

              <div className={styles.radioRow}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="statusMode"
                    value="VERIFIED"
                    checked={statusMode === 'VERIFIED'}
                    onChange={(e) => setStatusMode(e.target.value)}
                    className={styles.radio}
                  />
                  <span>Verified Only</span>
                </label>

                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="statusMode"
                    value="ALL"
                    checked={statusMode === 'ALL'}
                    onChange={(e) => setStatusMode(e.target.value)}
                    className={styles.radio}
                  />
                  <span>All</span>
                </label>
              </div>

              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchMode === 'text' ? 'Search words...' : 'Search definitions...'}
                className={styles.searchInput}
              />
            </div>
          </div>

          {translationsLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading translations...</p>
            </div>
          ) : translations.length === 0 ? (
            <div className={styles.empty}>
              <svg className={styles.emptyIcon} viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
              <p>
                {searchQuery
                  ? 'No translations found matching your search.'
                  : 'No words available yet. Be the first to contribute!'}
              </p>
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