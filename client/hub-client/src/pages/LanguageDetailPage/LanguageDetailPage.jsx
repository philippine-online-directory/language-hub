import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { languageService } from '../../api/languageService';
import useDebounce from '../../hooks/useDebounce';
import WordDisplay from '../../components/WordDisplay/WordDisplay';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import styles from './LanguageDetailPage.module.css';

export default function LanguageDetailPage() {
  const { isoCode } = useParams();

  const [language, setLanguage] = useState(null);
  const [translations, setTranslations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [translationsLoading, setTranslationsLoading] = useState(true);
  const [error, setError] = useState(null);

  // search UI
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('text'); // 'text' | 'definition'
  const [statusMode, setStatusMode] = useState('VERIFIED'); // 'VERIFIED' | 'ALL'

  const debouncedSearch = useDebounce(searchQuery, 400);

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

  // fetch translations whenever search/status changes
  useEffect(() => {
    const fetchTranslations = async () => {
      setTranslationsLoading(true);
      setError(null);

      try {
        const params = { status: statusMode };

        if (debouncedSearch) {
          if (searchMode === 'text') params.text = debouncedSearch;
          if (searchMode === 'definition') params.definition = debouncedSearch;
        }

        const transData = await languageService.getTranslations(isoCode, params);
        setTranslations(transData);
      } catch (err) {
        setError('Failed to load translations. Please try again.');
        console.error('Error fetching translations:', err);
      } finally {
        setTranslationsLoading(false);
      }
    };

    fetchTranslations();
  }, [isoCode, debouncedSearch, searchMode, statusMode]);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const handleSearchModeChange = (e) => {
    setSearchMode(e.target.value);
    setSearchQuery(''); // reset because the backend param changes (text vs definition)
  };

  const handleStatusModeChange = (e) => {
    setStatusMode(e.target.value);
  };

  if (loading) {
    return (
      <div className={styles.languageDetailPage}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !language) {
    return (
      <div className={styles.languageDetailPage}>
        <div className={styles.container}>
          <div className={styles.error}>{error || 'Language not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.languageDetailPage}>
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

          <Button variant="primary">Contribute Word</Button>
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
                    onChange={handleSearchModeChange}
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
                    onChange={handleSearchModeChange}
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
                    onChange={handleStatusModeChange}
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
                    onChange={handleStatusModeChange}
                    className={styles.radio}
                  />
                  <span>All</span>
                </label>
              </div>

              <Input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={searchMode === 'text' ? 'Search words...' : 'Search definitions...'}
                className={styles.searchInput}
              />
            </div>
          </div>

          {translationsLoading ? (
            <div className={styles.loading}>Loading translations...</div>
          ) : translations.length === 0 ? (
            <div className={styles.empty}>
              {searchQuery
                ? 'No translations found matching your search.'
                : 'No words available yet. Be the first to contribute!'}
            </div>
          ) : (
            <div className={styles.translationsGrid}>
              {translations.map((translation) => (
                <WordDisplay key={translation.id} translation={translation} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
