import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { setService } from '../../api/setService';
import { gameService } from '../../api/gameService';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import styles from './FlashcardGame.module.css';

export default function FlashcardGame() {
    const { setId } = useParams();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [loading, setLoading] = useState(true);
    const [startTime] = useState(Date.now());
    const [viewedCards, setViewedCards] = useState(new Set());
    const [mounted, setMounted] = useState(false);
    const [gameResult, setGameResult] = useState(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchWords = async () => {
            try {
                // Fetch the translations array directly
                const translations = await setService.getSetWords(setId);

                console.log('Fetched translations:', translations);

                // Backend returns array of translations directly
                if (!Array.isArray(translations) || translations.length === 0) {
                    throw new Error('No words found in set');
                }

                // Shuffle the words
                const shuffled = [...translations].sort(() => Math.random() - 0.5);
                setWords(shuffled);
            } catch (err) {
                console.error('Error fetching words:', err);
                alert('Failed to load flashcards');
                navigate(`/sets/${setId}`);
            } finally {
                setLoading(false);
            }
        };
        fetchWords();
    }, [setId, navigate]);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
        if (!isFlipped) {
            setViewedCards(prev => new Set([...prev, currentIndex]));
        }
    };

    const handleNext = () => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
            setShowDetails(false);
        } else {
            handleFinish();
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setIsFlipped(false);
            setShowDetails(false);
        }
    };

    const handleFinish = async () => {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        // Score = percentage of cards viewed (0-100%)
        const score = words.length > 0 ? Math.round((viewedCards.size / words.length) * 100) : 0;

        if (isAuthenticated) {
            try {
                await gameService.uploadGameSession(setId, {
                    gameType: 'FLASHCARD',
                    score,
                    duration,
                });
            } catch (err) {
                console.error('Error saving game session:', err);
            }
        }
        setGameResult({ score, duration, viewed: viewedCards.size, total: words.length });
        // navigate(`/sets/${setId}`);
    };

    const handleKeyPress = (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleFlip();
        } else if (e.key === 'ArrowRight') {
            handleNext();
        } else if (e.key === 'ArrowLeft') {
            handlePrevious();
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentIndex, isFlipped]);

    // Game result screen
    if (gameResult) {
        return (
            <div className={`${styles.flashcardGame} ${styles.mounted}`}>
                <div className={styles.backgroundPattern}></div>
                <div className={styles.container}>
                    <div className={styles.resultsScreen}>
                        <h1 className={styles.resultsTitle}>Session Complete!</h1>
                        {isAuthenticated ? (
                            <p className={styles.resultsSaved}>Your results have been saved</p>
                        ) : (
                            <p className={styles.resultsGuest}>Sign in to save your progress</p>
                        )}
                        <div className={styles.resultsStats}>
                            <div className={styles.resultsStat}>
                                <span className={styles.resultsStatValue}>{gameResult.score}%</span>
                                <span className={styles.resultsStatLabel}>Cards Viewed</span>
                            </div>
                            <div className={styles.resultsStat}>
                                <span className={styles.resultsStatValue}>{gameResult.viewed}/{gameResult.total}</span>
                                <span className={styles.resultsStatLabel}>Completed</span>
                            </div>
                            <div className={styles.resultsStat}>
                                <span className={styles.resultsStatValue}>{gameResult.duration}s</span>
                                <span className={styles.resultsStatLabel}>Duration</span>
                            </div>
                        </div>
                        <div className={styles.resultsActions}>
                            <Button onClick={() => { setGameResult(null); setCurrentIndex(0); setIsFlipped(false); setViewedCards(new Set()); setWords(prev => [...prev].sort(() => Math.random() - 0.5));}}>
                                Play Again
                            </Button>
                            <Button variant="secondary" onClick={() => navigate('/sets')}>
                                Back to Sets
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.flashcardGame}>
                <div className={styles.container}>
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading flashcards...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (words.length === 0) {
        return (
            <div className={styles.flashcardGame}>
                <div className={styles.container}>
                    <div className={styles.empty}>
                        <p>No words available in this set</p>
                        <Button onClick={() => navigate(`/sets/${setId}`)}>
                            Back to Set
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const currentWord = words[currentIndex];
    const progress = ((currentIndex + 1) / words.length) * 100;

    return (
        <div className={`${styles.flashcardGame} ${mounted ? styles.mounted : ''}`}>
            <div className={styles.backgroundPattern}></div>

            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.title}>Flashcards</h1>
                        <div className={styles.progressInfo}>
                            <span className={styles.currentCard}>{currentIndex + 1}</span>
                            <span className={styles.separator}>/</span>
                            <span className={styles.totalCards}>{words.length}</span>
                        </div>
                    </div>
                    <div className={styles.stats}>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Viewed</span>
                            <span className={styles.statValue}>{viewedCards.size}/{words.length}</span>
                        </div>
                    </div>
                </header>

                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <div className={styles.cardContainer}>
                    <div
                        className={`${styles.flashcardWrapper} ${isFlipped ? styles.flipped : ''}`}
                        onClick={handleFlip}
                    >
                        <div className={styles.flashcard}>
                            <div className={styles.cardFace}>
                                <div className={styles.cardContent}>
                                    <div className={styles.cardLabel}>Word</div>
                                    <h2 className={styles.wordText}>{currentWord.wordText}</h2>
                                    {currentWord.ipa && (
                                        <p className={styles.ipa}>{currentWord.ipa}</p>
                                    )}
                                    {currentWord.language && (
                                        <div className={styles.languageBadge}>
                                            {currentWord.language.name}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.flipHint}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                                        <path d="M21 3v5h-5" />
                                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                                        <path d="M3 21v-5h5" />
                                    </svg>
                                    <span>Click to flip</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.flashcard}>
                            <div className={styles.cardFace}>
                                <div className={styles.cardContent}>
                                    <div className={styles.cardLabel}>Definition</div>
                                    <p className={styles.definition}>
                                        {currentWord.englishDefinition}
                                    </p>
                                </div>
                                <div className={styles.flipHint}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                                        <path d="M21 3v5h-5"/>
                                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                                        <path d="M3 21v-5h5"/>
                                    </svg>
                                    <span>Click to flip back</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isFlipped && (currentWord.exampleSentence || currentWord.ipa) && (
                        <div className={styles.detailsSection}>
                            <button
                                className={styles.detailsToggle}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDetails(!showDetails);
                                }}
                            >
                                {showDetails ? 'Hide Details' : 'Show More Details'}
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    style={{ transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>

                            {showDetails && (
                                <Card className={styles.detailsCard}>
                                    {currentWord.ipa && (
                                        <div className={styles.detailItem}>
                                            <h3 className={styles.detailLabel}>Pronunciation</h3>
                                            <p className={styles.detailValue}>{currentWord.ipa}</p>
                                        </div>
                                    )}
                                    {currentWord.exampleSentence && (
                                        <div className={styles.detailItem}>
                                            <h3 className={styles.detailLabel}>Example Sentence</h3>
                                            <p className={styles.detailValue}>{currentWord.exampleSentence}</p>
                                        </div>
                                    )}
                                </Card>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.controls}>
                    <button
                        className={styles.navButton}
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        aria-label="Previous card"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                        <span>Previous</span>
                    </button>

                    <button
                        className={styles.navButton}
                        onClick={handleNext}
                        aria-label="Next card"
                    >
                        <span>{currentIndex === words.length - 1 ? 'Finish' : 'Next'}</span>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>

                <div className={styles.footer}>
                    <button
                        className={styles.exitButton}
                        onClick={handleFinish}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Exit Practice
                    </button>
                    <div className={styles.keyboardHints}>
                        <span className={styles.hint}>
                            <kbd>Space</kbd> to flip
                        </span>
                        <span className={styles.hint}>
                            <kbd>←</kbd> <kbd>→</kbd> to navigate
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}