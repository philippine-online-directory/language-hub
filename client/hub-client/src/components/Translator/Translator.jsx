import { useState, useEffect, useRef, useCallback } from 'react';
import { translatorService } from '../../api/translatorService';
import LanguagePickerModal from '../LanguagePickerModal/LanguagePickerModal';
import useDebounce from '../../hooks/useDebounce';
import styles from './Translator.module.css';

export default function Translator({ compact = false }) {
    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const [direction, setDirection] = useState('en-to-lang'); // 'en-to-lang' | 'lang-to-en'
    const [inputText, setInputText] = useState('');
    const [results, setResults] = useState(null);       // null = untouched, [] = no results, [...] = results
    const [loading, setLoading] = useState(false);
    const [inputError, setInputError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [swapCount, setSwapCount] = useState(0);
    const inputRef = useRef(null);

    const debouncedInput = useDebounce(inputText, 500);

    // Allows: letters (including accented), spaces, hyphens, apostrophes
    // Blocks: digits, symbols like $, @, #, etc.
    const validate = (text) => {
        if (!text || !text.trim()) return '';
        if (/[^a-zA-Z\u00C0-\u024F\s'.,\-]/.test(text.trim())) return 'Only letters, hyphens, apostrophes, periods, and commas are allowed';
        return '';
    };

    useEffect(() => {
        const text = debouncedInput.trim();

        if (!text) {
            setResults(null);
            setInputError('');
            return;
        }

        const err = validate(text);
        if (err) {
            setInputError(err);
            setResults(null);
            return;
        }

        setInputError('');

        if (!selectedLanguage) {
            setResults(null);
            return;
        }

        const run = async () => {
            setLoading(true);
            try {
                const data = await translatorService.translate(
                    selectedLanguage.isoCode,
                    text,
                    direction
                );
                setResults(data.results);
            } catch (err) {
                setInputError('Something went wrong. Please try again.');
                setResults(null);
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [debouncedInput, direction, selectedLanguage]);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputText(val);
        setResults(null);

        if (inputError) {
            const err = validate(val);
            if (!err) setInputError('');
        }
    };

    const handleSwap = () => {
        if (!selectedLanguage) return;

        setSwapCount(c => c + 1);

        const newDirection = direction === 'en-to-lang' ? 'lang-to-en' : 'en-to-lang';

        // If there's a single result, populate its text into the input for the new direction
        if (results && results.length === 1) {
            const result = results[0];
            const newInputText = direction === 'en-to-lang'
                ? result.wordText
                : result.englishDefinition;
            setInputText(newInputText);
        } else {
            setInputText('');
        }

        setResults(null);
        setLoading(false);
        setDirection(newDirection);
        inputRef.current?.focus();
    };

    const leftLabel = direction === 'en-to-lang' ? 'English' : (selectedLanguage?.name ?? 'Select language');
    const rightLabel = direction === 'en-to-lang' ? (selectedLanguage?.name ?? 'Select language') : 'English';

    const showOutput = !loading && results !== null;
    const hasResults = showOutput && results.length > 0;
    const noResults = showOutput && results.length === 0;

    return (
        <div className={`${styles.translator} ${compact ? styles.compact : ''}`}>
            {/* Language bar */}
            <div className={styles.langBar}>
                <div className={styles.langSlot}>
                    <span className={styles.langFixed}>English</span>
                </div>

                <div className={styles.swapZone}>
                    <button
                        className={`${styles.swapBtn} ${!selectedLanguage ? styles.swapDisabled : ''}`}
                        style={{ '--swap-rotation': `${swapCount * 180}deg` }}
                        onClick={handleSwap}
                        disabled={!selectedLanguage}
                        aria-label="Swap translation direction"
                        title={!selectedLanguage ? 'Select a language first' : 'Swap direction'}
                    >
                        <svg viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 5a1 1 0 000 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                        </svg>
                    </button>
                </div>

                <div className={styles.langSlot}>
                    <button
                        className={`${styles.langPickerBtn} ${!selectedLanguage ? styles.langPickerBtnEmpty : ''}`}
                        onClick={() => setModalOpen(true)}
                    >
                        <svg className={styles.langPickerIcon} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
                        </svg>
                        <span>{selectedLanguage ? selectedLanguage.name : 'Select language'}</span>
                        <svg className={styles.chevron} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Main panels */}
            <div className={styles.panels}>
                {/* Input panel */}
                <div className={`${styles.panel} ${styles.inputPanel}`}>
                    <div className={styles.panelLabel}>{leftLabel}</div>
                    <textarea
                        ref={inputRef}
                        className={`${styles.textarea} ${inputError ? styles.textareaError : ''}`}
                        value={inputText}
                        onChange={handleInputChange}
                        placeholder={direction === 'en-to-lang'
                            ? 'Enter an English word…'
                            : `Enter a ${selectedLanguage?.name ?? 'word'} word…`
                        }
                        rows={compact ? 3 : 5}
                        spellCheck={false}
                        aria-label="Input word"
                    />
                    {inputError && (
                        <div className={styles.inputErrorMsg}>
                            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {inputError}
                        </div>
                    )}
                    {inputText && (
                        <button
                            className={styles.clearBtn}
                            onClick={() => { setInputText(''); setResults(null); setInputError(''); inputRef.current?.focus(); }}
                            aria-label="Clear input"
                        >
                            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className={styles.panelDivider} />

                {/* Output panel */}
                <div className={`${styles.panel} ${styles.outputPanel}`}>
                    <div className={styles.panelLabel}>{rightLabel}</div>

                    {!selectedLanguage && !inputText && (
                        <div className={styles.outputPrompt}>
                            <svg viewBox="0 0 20 20" fill="currentColor" className={styles.promptIcon}>
                                <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
                            </svg>
                            <p>Select a language to begin translating</p>
                        </div>
                    )}

                    {selectedLanguage && !inputText && !loading && (
                        <div className={styles.outputIdle}>
                            <p>Start typing a word on the left…</p>
                        </div>
                    )}

                    {loading && (
                        <div className={styles.shimmerWrapper}>
                            <div className={styles.shimmerLine} style={{ width: '60%' }} />
                            <div className={styles.shimmerLine} style={{ width: '40%' }} />
                        </div>
                    )}

                    {noResults && (
                        <div className={styles.noResults}>
                            <svg viewBox="0 0 20 20" fill="currentColor" className={styles.noResultsIcon}>
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                            <p>No translation found for this word yet.</p>
                            <span>Try a different word or contribute one!</span>
                        </div>
                    )}

                    {hasResults && (
                        <div className={styles.resultsList}>
                            {results.map((result) => (
                                <div key={result.id} className={styles.resultCard}>
                                    <div className={styles.resultHeader}>
                                        <span className={styles.resultWord}>
                                            {direction === 'en-to-lang' ? result.wordText : result.englishDefinition}
                                        </span>
                                        {result.status === 'UNVERIFIED' && (
                                            <span className={styles.unverifiedBadge}>
                                                <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                Unverified
                                                <span className={styles.tooltip}>
                                                    This translation hasn't been verified yet — it may be inaccurate.
                                                </span>
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.resultMeta}>
                                        {result.partOfSpeech && (
                                            <span className={styles.metaTag}>{result.partOfSpeech}</span>
                                        )}
                                        {result.ipa && (
                                            <span className={styles.ipaTag}>/{result.ipa}/</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <LanguagePickerModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSelect={setSelectedLanguage}
                selectedIsoCode={selectedLanguage?.isoCode}
            />
        </div>
    );
}