import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Card from '../Card/Card';
import Button from '../Button/Button';
import AddToSetModal from '../AddToSetModal/AddToSetModal';
import { useAuth } from '../../context/AuthContext';
import { setService } from '../../api/setService';
import styles from './WordDisplay.module.css';

const COMPLETABLE_FIELDS = [
    { key: 'ipa',             label: 'IPA pronunciation' },
    { key: 'audioUrl',        label: 'Audio pronunciation' },
    { key: 'exampleSentence', label: 'Example sentence' },
    { key: 'usageComment',    label: 'Usage / notes comment' },
    { key: 'partOfSpeech',    label: 'Part of speech' },
];

function MissingFieldsBadge({ translation }) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    const missingFields = COMPLETABLE_FIELDS.filter(f => !translation?.[f.key]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handle = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handle = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', handle);
        return () => document.removeEventListener('keydown', handle);
    }, [open]);

    if (missingFields.length === 0) return null;

    return (
        <div
            className={styles.missingBadgeWrapper}
            ref={wrapperRef}
        >
            <button
                className={`${styles.missingBadge} ${open ? styles.missingBadgeActive : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen(prev => !prev);
                }}
                aria-label={`${missingFields.length} missing field${missingFields.length !== 1 ? 's' : ''}`}
                aria-expanded={open}
            >
                {/* Warning triangle icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            </button>

            {open && (
                <div
                    className={styles.missingPopup}
                    role="dialog"
                    aria-label="Missing fields"
                    onClick={(e) => e.stopPropagation()}
                >
                    <p className={styles.missingPopupTitle}>Missing fields</p>
                    <ul className={styles.missingList}>
                        {missingFields.map(f => (
                            <li key={f.key} className={styles.missingListItem}>
                                <span className={styles.missingDot} />
                                {f.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default function WordDisplay({ translation, showAddToSet = true, defaultExpanded = false }){
    const { isAuthenticated } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [isHovered, setIsHovered] = useState(false);
    const [setsContainingTranslation, setSetsContainingTranslation] = useState([]);
    const [loadingSets, setLoadingSets] = useState(false);

    useEffect(() => {
        const checkSets = async () => {
            if (!translation?.id || !isAuthenticated) return;
            setLoadingSets(true);
            try {
                const sets = await setService.getSetsContainingTranslation(translation.id);
                setSetsContainingTranslation(sets || []);
            } catch (error) {
                console.error('Error checking sets:', error);
                setSetsContainingTranslation([]);
            } finally {
                setLoadingSets(false);
            }
        };
        checkSets();
    }, [translation?.id, isAuthenticated]);

    const handleCardClick = () => {
        if (!isExpanded) setIsExpanded(true);
    };

    const handleCollapse = (e) => {
        e.stopPropagation();
        setIsExpanded(false);
    };

    return (
        <>
            <div
                className={`${styles.wordDisplayWrapper} ${isExpanded ? styles.expanded : ''}`}
                onClick={handleCardClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <Card className={`${styles.wordDisplay} ${isExpanded ? styles.expandedCard : styles.collapsedCard}`}>
                    {!isExpanded ? (
                        /* Collapsed View */
                        <div className={styles.collapsedView}>
                            <h2 className={styles.wordCollapsed}>{translation.wordText}</h2>

                            <div className={styles.collapsedRight}>
                                {translation.status === 'VERIFIED' && (
                                    <div className={styles.verifiedBadgeSmall}>✓</div>
                                )}
                                <MissingFieldsBadge translation={translation} />
                            </div>

                            {isHovered && (
                                <div className={styles.hoverTooltip}>
                                    <span>See details</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Expanded View */
                        <div className={styles.expandedView}>
                            <div className={styles.expandedHeader}>
                                <div className={styles.wordHeader}>
                                    <h2 className={styles.word}>{translation.wordText}</h2>
                                    {translation.partOfSpeech && (
                                        <span className={styles.partOfSpeechBadge}>
                                            {translation.partOfSpeech}
                                        </span>
                                    )}
                                </div>
                                <div className={styles.expandedHeaderActions}>
                                    <MissingFieldsBadge translation={translation} />
                                    <button
                                        className={styles.collapseButton}
                                        onClick={handleCollapse}
                                        aria-label="Collapse"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {translation.ipa && (
                                <p className={styles.ipa}>{translation.ipa}</p>
                            )}

                            <div className={styles.divider} />

                            <p className={styles.definition}>{translation.englishDefinition}</p>

                            {translation.audioUrl && (
                                <>
                                    <div className={styles.divider} />
                                    <div className={styles.audioPlayer}>
                                        <label className={styles.audioLabel}>Audio Pronunciation:</label>
                                        <audio controls src={translation.audioUrl} className={styles.audio}>
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                </>
                            )}

                            {translation.exampleSentence && (
                                <>
                                    <div className={styles.divider} />
                                    <p className={styles.example}>{translation.exampleSentence}</p>
                                </>
                            )}

                            {translation.usageComment && (
                                <>
                                    <div className={styles.divider} />
                                    <div className={styles.usageComment}>
                                        <span className={styles.usageCommentLabel}>
                                            <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            Usage Note
                                        </span>
                                        <p className={styles.usageCommentText}>{translation.usageComment}</p>
                                    </div>
                                </>
                            )}

                            <div className={styles.footer}>
                                <div className={styles.footerLeft}>
                                    {translation.status === 'VERIFIED' && (
                                        <div className={styles.verifiedBadge}>
                                            <span>Verified Translation</span>
                                        </div>
                                    )}
                                    {translation.author && (
                                        <div className={styles.attribution}>
                                            <span className={styles.attributionText}>Contributed by</span>
                                            <Link
                                                to={`/profile/${translation.author.id}`}
                                                className={styles.authorLink}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                @{translation.author.username}
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {showAddToSet && isAuthenticated && (
                                    <Button
                                        variant="secondary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setModalMode(setsContainingTranslation.length > 0 ? 'remove' : 'add');
                                            setShowModal(true);
                                        }}
                                        className={styles.addButton}
                                        disabled={loadingSets}
                                    >
                                        {loadingSets ? 'Loading...' :
                                            setsContainingTranslation.length > 0 ? 'Remove from Set' : 'Add to Set'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {showModal && (
                <AddToSetModal
                    translation={translation}
                    mode={modalMode}
                    setsContainingTranslation={setsContainingTranslation}
                    onClose={(refreshNeeded) => {
                        setShowModal(false);
                        if (refreshNeeded) {
                            setService.getSetsContainingTranslation(translation.id)
                                .then(sets => setSetsContainingTranslation(sets || []))
                                .catch(err => console.error('Error refreshing sets:', err));
                        }
                    }}
                />
            )}
        </>
    );
}