import { useState } from 'react';
import Card from '../Card/Card';
import Button from '../Button/Button';
import AddToSetModal from '../AddToSetModal/AddToSetModal';
import styles from './WordDisplay.module.css';

export default function WordDisplay({ translation, showAddToSet = true, defaultExpanded = false }){
    const [showModal, setShowModal] = useState(false);
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [isHovered, setIsHovered] = useState(false);

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

                            {translation.exampleSentence && (
                                <>
                                    <div className={styles.divider} />
                                    <p className={styles.example}>{translation.exampleSentence}</p>
                                </>
                            )}

                            <div className={styles.footer}>
                                {translation.status === 'VERIFIED' && (
                                    <div className={styles.verifiedBadge}>
                                        <span>Verified Translation</span>
                                    </div>
                                )}
                                
                                {showAddToSet && (
                                    <Button 
                                        variant="secondary" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowModal(true);
                                        }}
                                        className={styles.addButton}
                                    >
                                        Add to Set
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
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}