import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../Card/Card';
import Button from '../Button/Button';
import AddToSetModal from '../AddToSetModal/AddToSetModal';
import { useAuth } from '../../context/AuthContext';
import { setService } from '../../api/setService';
import styles from './WordDisplay.module.css';

export default function WordDisplay({ translation, showAddToSet = true, defaultExpanded = false }){
    const { isAuthenticated } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'remove'
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [isHovered, setIsHovered] = useState(false);
    const [setsContainingTranslation, setSetsContainingTranslation] = useState([]);
    const [loadingSets, setLoadingSets] = useState(false);

    // Check which sets contain this translation
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
        if (!isExpanded) {
            setIsExpanded(true);
        }
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
                            {translation.status === 'VERIFIED' && (
                                <div className={styles.verifiedBadgeSmall}>
                                    ✓
                                </div>
                            )}
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