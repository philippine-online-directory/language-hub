import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { setService } from '../../api/setService';
import { gameService } from '../../api/gameService';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import styles from './MatchingGame.module.css';

export default function MatchingGame() {
    const { setId } = useParams();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [cards, setCards] = useState([]);
    const [selectedCards, setSelectedCards] = useState([]);
    const [matchedPairs, setMatchedPairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startTime] = useState(Date.now());
    const [moves, setMoves] = useState(0);
    const [isChecking, setIsChecking] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [gameComplete, setGameComplete] = useState(false);
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

                // Take up to 8 words for the game
                const words = translations.slice(0, 8);

                // Create pairs of cards
                const gameCards = [];
                words.forEach((word, idx) => {
                    gameCards.push({
                        id: `word-${idx}`,
                        pairId: idx,
                        type: 'word',
                        content: word.wordText,
                        translation: word,
                    });
                    gameCards.push({
                        id: `def-${idx}`,
                        pairId: idx,
                        type: 'definition',
                        content: word.englishDefinition,
                        translation: word,
                    });
                });

                // Shuffle the cards
                const shuffledCards = gameCards.sort(() => Math.random() - 0.5);
                setCards(shuffledCards);
            } catch (err) {
                console.error('Error fetching words:', err);
                alert('Failed to load game');
                navigate(`/sets/${setId}`);
            } finally {
                setLoading(false);
            }
        };
        fetchWords();
    }, [setId, navigate]);

    const handleCardClick = (card) => {
        // Prevent clicking if checking, already selected, already matched, or two cards selected
        if (isChecking) return;
        if (selectedCards.find(c => c.id === card.id)) return;
        if (matchedPairs.includes(card.pairId)) return;
        if (selectedCards.length >= 2) return;

        const newSelected = [...selectedCards, card];
        setSelectedCards(newSelected);

        if (newSelected.length === 2) {
            setIsChecking(true);
            const currentMoves = moves + 1;
            setMoves(currentMoves);

            // Check if cards match
            if (newSelected[0].pairId === newSelected[1].pairId) {
                // Match found!
                setTimeout(() => {
                    const newMatchedPairs = [...matchedPairs, card.pairId];
                    setMatchedPairs(newMatchedPairs);
                    setSelectedCards([]);
                    setIsChecking(false);

                    // Check if game is complete
                    if (newMatchedPairs.length === cards.length / 2) {
                        setGameComplete(true);
                        setTimeout(() => handleFinish(currentMoves), 1500);
                    }
                }, 600);
            } else {
                // No match
                setTimeout(() => {
                    setSelectedCards([]);
                    setIsChecking(false);
                }, 1200);
            }
        }
    };

    const handleFinish = async (finalMoves) => {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        const totalPairs = cards.length / 2;
        // Use finalMoves parameter to avoid stale closure on moves state
        const currentMoves = finalMoves ?? moves;
        const score = currentMoves > 0 ? Math.min(100, Math.round((totalPairs / currentMoves) * 100)) : 0;

        if (isAuthenticated) {
            try {
                await gameService.uploadGameSession(setId, {
                    gameType: 'MATCHING',
                    score: Math.round(score),
                    duration,
                });
            } catch (err) {
                console.error('Error saving game session:', err);
            }
        }
        setGameResult({ score: Math.round(score), duration, moves: currentMoves, totalPairs });
        // navigate(`/sets/${setId}`);
    };

    // Game result screen
    if (gameResult) {
        return (
            <div className={`${styles.matchingGame} ${styles.mounted}`}>
                <div className={styles.backgroundPattern}></div>
                <div className={styles.container}>
                    <div className={styles.resultsScreen}>
                        <h1 className={styles.resultsTitle}>Game Complete!</h1>
                        {isAuthenticated ? (
                            <p className={styles.resultsSaved}>Your results have been saved</p>
                        ) : (
                            <p className={styles.resultsGuest}>Sign in to save your progress</p>
                        )}
                        <div className={styles.resultsStats}>
                            <div className={styles.resultsStat}>
                                <span className={styles.resultsStatValue}>{gameResult.score}%</span>
                                <span className={styles.resultsStatLabel}>Score</span>
                            </div>
                            <div className={styles.resultsStat}>
                                <span className={styles.resultsStatValue}>{gameResult.moves}</span>
                                <span className={styles.resultsStatLabel}>Moves</span>
                            </div>
                            <div className={styles.resultsStat}>
                                <span className={styles.resultsStatValue}>{gameResult.duration}s</span>
                                <span className={styles.resultsStatLabel}>Duration</span>
                            </div>
                        </div>
                        <div className={styles.resultsActions}>
                            <Button onClick={() => { setGameResult(null); setMatchedPairs([]); setSelectedCards([]); setMoves(0); setGameComplete(false); setCards(prev => [...prev].sort(() => Math.random() - 0.5));}}>
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
            <div className={styles.matchingGame}>
                <div className={styles.container}>
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading game...</p>
                    </div>
                </div>
            </div>
        );
    }

    const accuracy = moves > 0 ? Math.round((matchedPairs.length / moves) * 100) : 0;

    return (
        <div className={`${styles.matchingGame} ${mounted ? styles.mounted : ''}`}>
            <div className={styles.backgroundPattern}></div>

            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.title}>Matching Game</h1>
                        <p className={styles.subtitle}>Match words with their definitions</p>
                    </div>
                    <div className={styles.statsContainer}>
                        <div className={styles.statBox}>
                            <span className={styles.statLabel}>Matches</span>
                            <span className={styles.statValue}>
                                {matchedPairs.length} / {cards.length / 2}
                            </span>
                        </div>
                        <div className={styles.statBox}>
                            <span className={styles.statLabel}>Moves</span>
                            <span className={styles.statValue}>{moves}</span>
                        </div>
                        {moves > 0 && (
                            <div className={styles.statBox}>
                                <span className={styles.statLabel}>Accuracy</span>
                                <span className={styles.statValue}>{accuracy}%</span>
                            </div>
                        )}
                    </div>
                </header>

                {gameComplete && (
                    <div className={styles.completeMessage}>
                        <svg className={styles.completeIcon} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <h2>Perfect Match!</h2>
                        <p>You completed the game in {moves} moves</p>
                    </div>
                )}

                <div className={styles.grid}>
                    {cards.map((card, index) => {
                        const isSelected = selectedCards.find(c => c.id === card.id);
                        const isMatched = matchedPairs.includes(card.pairId);

                        return (
                            <div
                                key={card.id}
                                className={styles.cardWrapper}
                                style={{ '--card-index': index }}
                            >
                                <Card
                                    onClick={() => handleCardClick(card)}
                                    hoverable={!isMatched && !isSelected && !isChecking}
                                    className={`${styles.matchCard} ${
                                        isSelected ? styles.selected : ''
                                    } ${isMatched ? styles.matched : ''} ${
                                        card.type === 'word' ? styles.wordCard : styles.defCard
                                    }`}
                                >
                                    <div className={styles.cardInner}>
                                        <div className={styles.cardLabel}>
                                            {card.type === 'word' ? 'Word' : 'Definition'}
                                        </div>
                                        <div className={styles.cardContent}>
                                            {card.content}
                                        </div>
                                        {isMatched && (
                                            <div className={styles.matchBadge}>
                                                <svg viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        );
                    })}
                </div>

                <div className={styles.footer}>
                    <Button
                        variant="secondary"
                        onClick={() => navigate(`/sets/${setId}`)}
                        className={styles.exitButton}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Exit Game
                    </Button>
                    <div className={styles.instructions}>
                        Click on cards to reveal and match pairs
                    </div>
                </div>
            </div>
        </div>
    );
}