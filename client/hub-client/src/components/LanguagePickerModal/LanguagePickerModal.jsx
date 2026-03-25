import { useState, useEffect, useRef, useCallback } from 'react';
import { languageService } from '../../api/languageService';
import styles from './LanguagePickerModal.module.css';

export default function LanguagePickerModal({ isOpen, onClose, onSelect, selectedIsoCode }) {
    const [languages, setLanguages] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const searchRef = useRef(null);
    const modalRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        const fetchAll = async () => {
            setLoading(true);
            setError(null);
            try {
                const first = await languageService.getLanguages(1, 200);
                let all = first.languages;

                if (first.pagination.totalPages > 1) {
                    const remaining = [];
                    for (let p = 2; p <= first.pagination.totalPages; p++) {
                        remaining.push(languageService.getLanguages(p, 200));
                    }
                    const pages = await Promise.all(remaining);
                    pages.forEach(page => {
                        all = all.concat(page.languages);
                    });
                }

                setLanguages(all);
            } catch (err) {
                setError('Failed to load languages.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
        setSearchQuery('');
    }, [isOpen]);

    // Focus search input when opened
    useEffect(() => {
        if (isOpen && searchRef.current) {
            setTimeout(() => searchRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Escape key closes modal
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleBackdropClick = useCallback((e) => {
        if (e.target === e.currentTarget) onClose();
    }, [onClose]);

    const filtered = languages.filter(lang =>
        lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.isoCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-label="Select a language">
            <div className={styles.modal} ref={modalRef}>
                <div className={styles.modalHeader}>
                    <div>
                        <h2 className={styles.modalTitle}>Select a Language</h2>
                        <p className={styles.modalSubtitle}>
                            {languages.length > 0 ? `${languages.length} languages available` : ''}
                        </p>
                    </div>
                    <button className={styles.closeButton} onClick={onClose} aria-label="Close">
                        <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                <div className={styles.searchWrapper}>
                    <svg className={styles.searchIcon} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <input
                        ref={searchRef}
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search by name or ISO code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className={styles.clearSearch} onClick={() => setSearchQuery('')} aria-label="Clear search">
                            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className={styles.listWrapper}>
                    {loading ? (
                        <div className={styles.loadingState}>
                            <div className={styles.spinner}></div>
                            <p>Loading languages...</p>
                        </div>
                    ) : error ? (
                        <div className={styles.errorState}>{error}</div>
                    ) : filtered.length === 0 ? (
                        <div className={styles.emptyState}>
                            <svg viewBox="0 0 20 20" fill="currentColor" className={styles.emptyIcon}>
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                            <p>No languages found for "{searchQuery}"</p>
                        </div>
                    ) : (
                        <ul className={styles.list} role="listbox">
                            {filtered.map((lang) => (
                                <li key={lang.id}>
                                    <button
                                        className={`${styles.langItem} ${lang.isoCode === selectedIsoCode ? styles.selected : ''}`}
                                        onClick={() => { onSelect(lang); onClose(); }}
                                        role="option"
                                        aria-selected={lang.isoCode === selectedIsoCode}
                                    >
                                        <div className={styles.langInfo}>
                                            <span className={styles.langName}>{lang.name}</span>
                                            {lang.speakerCount > 0 && (
                                                <span className={styles.langMeta}>
                                                    {lang.speakerCount.toLocaleString()} speakers
                                                </span>
                                            )}
                                        </div>
                                        <span className={styles.isoCode}>{lang.isoCode}</span>
                                        {lang.isoCode === selectedIsoCode && (
                                            <svg className={styles.checkIcon} viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}