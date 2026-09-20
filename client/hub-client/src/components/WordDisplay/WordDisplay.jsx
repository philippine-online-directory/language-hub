import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Card from '../Card/Card';
import Button from '../Button/Button';
import AddToSetModal from '../AddToSetModal/AddToSetModal';
import { useAuth } from '../../context/AuthContext';
import { setService } from '../../api/setService';
import styles from './WordDisplay.module.css';
import ContributeMissingModal from '../ContributeMissingModal/ContributeMissingModal';
import { createPortal } from 'react-dom';
import { getWordCardToggleTarget } from '../../utils/wordCardBehavior';
import { getWordPath } from '../../utils/wordEntry';

const COMPLETABLE_FIELDS = [
    { key: 'audioUrl',        label: 'Audio pronunciation' },
    { key: 'exampleSentence', label: 'Example sentence' },
    { key: 'usageComment',    label: 'Usage / notes comment' },
    { key: 'partOfSpeech',    label: 'Part of speech' },
];

const COMPACT_ALERT_FIELDS = new Set(['audioUrl', 'partOfSpeech']);

function MissingFieldsBadge({ translation, setShowContributeModal, setFieldsToContribute, isCardExpanded }) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);
    const popupId = `missing-fields-${translation.id}`;
    const tooltipId = `missing-fields-tooltip-${translation.id}`;

    const allMissingFields = COMPLETABLE_FIELDS.filter(f => !translation?.[f.key]);
    const missingFields = isCardExpanded
        ? allMissingFields
        : allMissingFields.filter(f => COMPACT_ALERT_FIELDS.has(f.key));

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
            className={`${styles.missingBadgeWrapper} ${open ? styles.missingBadgeWrapperOpen : ''}`}
            ref={wrapperRef}
        >
            <button
                type="button"
                className={`${styles.missingBadge} ${isCardExpanded ? styles.detailsBadge : ''} ${open ? styles.missingBadgeActive : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen(prev => !prev);
                }}
                aria-label={isCardExpanded
                    ? `${missingFields.length} detail${missingFields.length !== 1 ? 's' : ''} available to add`
                    : `${missingFields.length} missing field${missingFields.length !== 1 ? 's' : ''}`}
                aria-expanded={open}
                aria-controls={popupId}
                aria-describedby={isCardExpanded ? tooltipId : undefined}
            >
                {isCardExpanded ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                )}
            </button>

            {isCardExpanded && (
                <span id={tooltipId} role="tooltip" className={styles.missingTooltip}>
                    Add missing information
                </span>
            )}

            {open && (
                <div
                    id={popupId}
                    className={`${styles.missingPopup} ${isCardExpanded ? styles.detailsPopup : ''}`}
                    role="dialog"
                    aria-label="Missing fields"
                    onClick={(e) => e.stopPropagation()}
                >
                    <p className={styles.missingPopupTitle}>{isCardExpanded ? 'Add details' : 'Missing fields'}</p>
                    <ul className={styles.missingList}>
                        {missingFields.map(f => (
                            <li key={f.key} className={styles.missingListItem}>
                                <span className={`${styles.missingDot} ${isCardExpanded ? styles.detailsDot : ''}`} />
                                {f.label}
                            </li>
                        ))}
                    </ul>

                    <div>
                        <button
                          type="button"
                          className={styles.contributeButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpen(false);
                            setShowContributeModal(true);
                            setFieldsToContribute(missingFields.map(f => f.key));
                          }}

                        >
                          {isCardExpanded ? 'Contribute details' : 'Contribute Missing Fields'}
                        </button>
                    </div>
                </div>
                
            )}
        </div>
    );
}

export default function WordDisplay({ translation, showAddToSet = true, defaultExpanded = false, expanded, onToggle }){
    const { isAuthenticated } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [isExpandedInternal, setIsExpandedInternal] = useState(defaultExpanded);
    const isExpanded = expanded !== undefined ? expanded : isExpandedInternal;
    const [setsContainingTranslation, setSetsContainingTranslation] = useState([]);
    const [loadingSets, setLoadingSets] = useState(false);
    const [showContributeModal, setShowContributeModal] = useState(false);
    const [fieldsToContribute, setFieldsToContribute] = useState([]);
    const [translationOverride, setTranslationOverride] = useState(null);
    const wrapperRef = useRef(null);
    const previousHeightRef = useRef(null);
    const heightAnimationRef = useRef(null);
    const displayedTranslation = translationOverride ?? translation;
    const wordPath = getWordPath(displayedTranslation);
    const detailsId = `word-details-${displayedTranslation.id}`;

    useEffect(() => {
        setTranslationOverride(null);
    }, [translation]);

    useLayoutEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const nextHeight = wrapper.scrollHeight;
        const previousHeight = previousHeightRef.current;
        previousHeightRef.current = nextHeight;

        if (
            previousHeight === null ||
            previousHeight === nextHeight ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            return;
        }

        heightAnimationRef.current?.cancel();
        const animation = wrapper.animate(
            [
                { height: `${previousHeight}px` },
                { height: `${nextHeight}px` },
            ],
            {
                duration: 650,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }
        );
        heightAnimationRef.current = animation;

        return () => animation.cancel();
    }, [isExpanded]);

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

    const applyToggle = (action) => {
        const target = getWordCardToggleTarget(isExpanded, translation.id, action);
        if (target === undefined) return;

        if (onToggle) onToggle(target);
        else setIsExpandedInternal(target !== null);
    };

    const handleQuickView = (e) => {
        e.stopPropagation();
        applyToggle('expand');
    };

    const handleCollapse = (e) => {
        e.stopPropagation();
        applyToggle('collapse');
    };

    return (
        <>
            <div
                ref={wrapperRef}
                className={`${styles.wordDisplayWrapper} ${isExpanded ? styles.expanded : ''} ${wordPath && !isExpanded ? styles.linked : ''}`}
            >
                <Card className={`${styles.wordDisplay} ${isExpanded ? styles.expandedCard : styles.collapsedCard}`}>
                    {!isExpanded ? (
                        /* Collapsed View */
                        <div className={styles.collapsedView}>
                            {wordPath && (
                                <Link
                                    to={wordPath}
                                    className={`no-effect ${styles.cardEntryLink}`}
                                    aria-label={`View full entry for ${displayedTranslation.wordText}`}
                                />
                            )}
                            <div className={styles.collapsedWordGroup}>
                                <h2 className={styles.wordCollapsed}>
                                    {displayedTranslation.wordText}
                                </h2>
                                {displayedTranslation.englishDefinition && (
                                    <span className={styles.wordEnglish}>{displayedTranslation.englishDefinition}</span>
                                )}
                            </div>

                            <div className={styles.collapsedRight}>
                                {displayedTranslation.status === 'VERIFIED' && (
                                    <div className={styles.verifiedBadgeSmall}>✓</div>
                                )}
                                <MissingFieldsBadge translation={displayedTranslation} setShowContributeModal={setShowContributeModal} setFieldsToContribute={setFieldsToContribute} isCardExpanded={false} />
                                <button
                                    type="button"
                                    className={styles.quickViewButton}
                                    onClick={handleQuickView}
                                    aria-expanded={false}
                                    aria-controls={detailsId}
                                >
                                    <span>Quick view</span>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Expanded View */
                        <div className={styles.expandedView} id={detailsId}>
                            <div className={styles.expandedHeader}>
                                <div className={styles.wordHeader}>
                                    <h2 className={styles.word}>
                                        {wordPath ? (
                                            <Link
                                                to={wordPath}
                                                className={styles.wordLink}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {displayedTranslation.wordText}
                                            </Link>
                                        ) : displayedTranslation.wordText}
                                    </h2>
                                    {displayedTranslation.partOfSpeech && (
                                        <span className={styles.partOfSpeechBadge}>
                                            {displayedTranslation.partOfSpeech}
                                        </span>
                                    )}
                                </div>
                                <div className={styles.expandedHeaderActions}>
                                    <MissingFieldsBadge translation={displayedTranslation} setShowContributeModal={setShowContributeModal} setFieldsToContribute={setFieldsToContribute} isCardExpanded={true} />
                                    <button
                                        type="button"
                                        className={styles.collapseButton}
                                        onClick={handleCollapse}
                                        aria-expanded={true}
                                        aria-controls={detailsId}
                                    >
                                        <span>Collapse</span>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                            <polyline points="18 15 12 9 6 15"></polyline>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className={styles.divider} />

                            <p className={styles.definition}>{displayedTranslation.englishDefinition}</p>

                            {displayedTranslation.audioUrl && (
                                <>
                                    <div className={styles.divider} />
                                    <div className={styles.audioPlayer}>
                                        <label className={styles.audioLabel}>Audio Pronunciation:</label>
                                        <audio controls src={displayedTranslation.audioUrl} className={styles.audio} onClick={(e) => e.stopPropagation()}>
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                </>
                            )}

                            {displayedTranslation.exampleSentence && (
                                <>
                                    <div className={styles.divider} />
                                    <div className={styles.exampleGroup}>
                                        <p className={styles.example}>{displayedTranslation.exampleSentence}</p>
                                        {displayedTranslation.englishExampleSentence && (
                                            <div className={styles.englishExampleSentence}>
                                                <span className={styles.englishExampleLabel}>English translation</span>
                                                <p>{displayedTranslation.englishExampleSentence}</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {displayedTranslation.usageComment && (
                                <>
                                    <div className={styles.divider} />
                                    <div className={styles.usageComment}>
                                        <span className={styles.usageCommentLabel}>
                                            <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            Usage Note
                                        </span>
                                        <p className={styles.usageCommentText}>{displayedTranslation.usageComment}</p>
                                    </div>
                                </>
                            )}

                            <div className={styles.footer}>
                                <div className={styles.footerLeft}>
                                    {displayedTranslation.status === 'VERIFIED' && (
                                        <div className={styles.verifiedBadge}>
                                            <span>Verified Translation</span>
                                        </div>
                                    )}
                                    {displayedTranslation.author && (
                                        <div className={styles.attribution}>
                                            <span className={styles.attributionText}>Contributed by</span>
                                            <Link
                                                to={`/profile/${displayedTranslation.author.id}`}
                                                className={styles.authorLink}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                @{displayedTranslation.author.username}
                                            </Link>

                                            {displayedTranslation.secondaryAuthors?.length > 0 && (
                                                <div className={styles.secondaryAuthors}>
                                                  <span className={styles.moreAuthorsLabel}>
                                                    +{displayedTranslation.secondaryAuthors.length} more
                                                  </span>
                                                  <div className={styles.secondaryAuthorsDropdown}>
                                                    {displayedTranslation.secondaryAuthors.map((author) => (
                                                      <Link
                                                        key={author.id}
                                                        to={`/profile/${author.id}`}
                                                        className={styles.secondaryAuthorLink}
                                                        onClick={(e) => e.stopPropagation()}
                                                      >
                                                        @{author.username}
                                                      </Link>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                        </div>
                                    )}
                                </div>

                                <div className={styles.footerActions}>
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
                                    {wordPath && (
                                        <Link
                                            to={wordPath}
                                            className={styles.fullEntryLink}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            View full entry
                                            <span aria-hidden="true">→</span>
                                        </Link>
                                    )}
                                </div>
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

            {showContributeModal && createPortal(
                <ContributeMissingModal
                    translation={displayedTranslation}
                    fieldsToContribute={fieldsToContribute}
                    onClose={() => setShowContributeModal(false)}
                    onComplete={setTranslationOverride}
                />,
                document.body
            )}
        </>
    );
}
