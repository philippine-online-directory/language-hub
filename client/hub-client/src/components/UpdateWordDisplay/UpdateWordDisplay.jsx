import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Card from '../Card/Card';
import styles from './UpdateWordDisplay.module.css';




export default function UpdateWordDisplay({ request, defaultExpanded = false }){
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [isHovered, setIsHovered] = useState(false);
    const translation = request.translation;
    const proposedData = request.proposedData;
    const submittedBy = request.submittedBy;

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
                                    <div className={styles.differenceGroupRow}>
                                      {translation.partOfSpeech && (
                                        <span
                                          className={`${styles.partOfSpeechBadge} ${
                                            proposedData.partOfSpeech ? `${styles.removedValue} ${styles.strikeThrough}` : ""
                                          }`}
                                        >
                                          {translation.partOfSpeech}
                                        </span>
                                      )}
                                  
                                      {proposedData.partOfSpeech && (
                                        <span className={`${styles.partOfSpeechBadge} ${styles.addedValue}`}>
                                          {proposedData.partOfSpeech}
                                        </span>
                                      )}  
                                    </div>
                                    
                                  
                                </div>
                                <div className={styles.expandedHeaderActions}>
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

                            <div className={styles.differenceGroupRow}>
                              {translation.ipa && (
                                <span
                                  className={`${styles.ipa} ${
                                    proposedData.ipa ? `${styles.removedValue} ${styles.strikeThrough}` : ""
                                  }`}
                                >
                                  {translation.ipa}
                                </span>
                              )}
                          
                              {proposedData.ipa && (
                                <span className={`${styles.ipa} ${styles.addedValue}`}>
                                  {proposedData.ipa}
                                </span>
                              )}  
                            </div>

                            <div className={styles.divider} />

                            <p className={styles.definition}>{translation.englishDefinition}</p>
                            
                            {translation.audioUrl && (
                                <>
                                    <div className={styles.divider} />
                                    <div className={`${styles.audioPlayer} ${proposedData.audioUrl? `${styles.removedValue}` : ""}`}>
                                        <label className={`${styles.audioLabel} ${proposedData.audioUrl? `${styles.removedValueColor} ${styles.strikeThrough}` : ""}`}>
                                          Audio Pronunciation:
                                        </label>
                                        <audio controls src={translation.audioUrl} className={styles.audio}>
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                </>
                            )}
                            {proposedData.audioUrl && (
                                <>
                                    {translation.audioUrl ? (
                                      <div style={{ marginTop: "10px" }} />
                                    ) : (
                                      <div className={styles.divider} />
                                    )}
                                    <div className={`${styles.audioPlayer} ${styles.addedValue}`}>
                                        <label className={`${styles.audioLabel} ${styles.addedValueColor}`}>Audio Pronunciation:</label>
                                        <audio controls src={proposedData.audioUrl} className={styles.audio}>
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                </>
                            )}

                            {translation.exampleSentence && (
                                <>
                                    <div className={styles.divider} />
                                    <p className={`${styles.example} ${proposedData.exampleSentence? `${styles.removedValue} ${styles.strikeThrough}` : ""}`}>
                                        {translation.exampleSentence}
                                    </p>
                                </>
                            )}
                            {proposedData.exampleSentence && (
                                <>
                                    {translation.exampleSentence ? (
                                      <div style={{ marginTop: "10px" }} />
                                    ) : (
                                      <div className={styles.divider} />
                                    )}
                                    <p className={`${styles.example} ${styles.addedValue}`}>
                                        {proposedData.exampleSentence}
                                    </p>
                                </>
                            )}

                            {translation.usageComment && (
                                <>
                                    <div className={styles.divider} />
                                    <div className={`${styles.usageComment} ${proposedData.usageComment? `${styles.removedValue}` : ""}`}>
                                        <span className={`${styles.usageCommentLabel} ${proposedData.usageComment? `${styles.removedValueColor}` : ""}`}>
                                            <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            Usage Note
                                        </span>
                                        <p className={`${styles.usageCommentText} ${proposedData.usageComment? `${styles.removedValueColor} ${styles.strikeThrough}` : ""}`}>
                                            {translation.usageComment}
                                        </p>
                                    </div>
                                </>
                            )}
                            {proposedData.usageComment && (
                                <>
                                    {translation.usageComment  ? (
                                      <div style={{ marginTop: "10px" }} />
                                    ) : (
                                      <div className={styles.divider} />
                                    )}
                                    <div className={`${styles.usageComment} ${styles.addedValue}`}>
                                        <span className={`${styles.usageCommentLabel} ${styles.addedValueColor}`}>
                                            <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            Usage Note
                                        </span>
                                        <p className={`${styles.usageCommentText}  ${styles.addedValueColor}`}>
                                            {proposedData.usageComment}
                                        </p>
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
                                    {submittedBy && (
                                        <div className={styles.attribution}>
                                            <span className={styles.attributionText}>Submitted by</span>
                                            <Link
                                                to={`/profile/${submittedBy.id}`}
                                                className={styles.authorLink}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                @{submittedBy.username}
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

        </>
    );
}