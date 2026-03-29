import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { setService } from '../../api/setService';
import { gameService } from '../../api/gameService';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import Input from '../../components/Input/Input';
import styles from './WritingGame.module.css';

export default function WritingGame() {
    const { setId } = useParams();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);
    const [startTime] = useState(Date.now());
    const [correctCount, setCorrectCount] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [attempts, setAttempts] = useState(0);
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
            }
            catch (err) {
                console.error('Error fetching words:', err);
                alert('Failed to load game');
                navigate(`/sets/${setId}`);
            }
            finally {
                setLoading(false);
            }
        };
        fetchWords();
    }, [setId, navigate]);

    const checkAnswer = () => {
        const currentWord = words[currentIndex];
        const userAnswerNormalized = userAnswer.trim().toLowerCase();
        const correctAnswerNormalized = currentWord.wordText.trim().toLowerCase();
        const correct = userAnswerNormalized === correctAnswerNormalized;

        setFeedback({
            correct,
            correctAnswer: currentWord.wordText,
            userAnswer: userAnswer.trim(),
        });

        setAttempts(prev => prev + 1);

        if (correct) {
            setCorrectCount(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setUserAnswer('');
            setFeedback(null);
            setShowHint(false);
        }
        else {
            handleFinish();
        }
    };

    const handleSkip = () => {
        setAttempts(prev => prev + 1);
        handleNext();
    };

    // Called only when the user completes all questions
    const handleFinish = async () => {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        // Score = accuracy: correct answers out of all attempted questions (0-100%)
        const score = attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0;

        if (isAuthenticated) {
            try {
                await gameService.uploadGameSession(setId, {
                    gameType: 'WRITING',
                    score,
                    duration,
                });
            } catch (err) {
                console.error('Error saving game session:', err);
            }
        }
        setGameResult({ score, duration, correct: correctCount, total: words.length });
        // navigate(`/sets/${setId}`);
    };

    // Called when user exits early — navigates without saving
    const handleExit = () => {
        navigate(`/sets/${setId}`);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !feedback && userAnswer.trim()) {
            checkAnswer();
        }
    };

    // Game result screen
    if (gameResult) {
        return (
            <div className={`${styles.writingGame} ${styles.mounted}`}>
                <div className={styles.backgroundPattern}></div>
                <div className={styles.container}>
                    <div className={styles.resultsScreen}>
                        <h1 className={styles.resultsTitle}>Practice Complete!</h1>
                        {isAuthenticated ? (
                            <p className={styles.resultsSaved}>Your results have been saved</p>
                        ) : (
                            <p className={styles.resultsGuest}>Sign in to save your progress</p>
                        )}
                        <div className={styles.resultsStats}>
                            <div className={styles.resultsStat}>
                                <span className={styles.resultsStatValue}>{gameResult.score}%</span>
                                <span className={styles.resultsStatLabel}>Accuracy</span>
                            </div>
                            <div className={styles.resultsStat}>
                                <span className={styles.resultsStatValue}>{gameResult.correct}/{gameResult.total}</span>
                                <span className={styles.resultsStatLabel}>Correct</span>
                            </div>
                            <div className={styles.resultsStat}>
                                <span className={styles.resultsStatValue}>{gameResult.duration}s</span>
                                <span className={styles.resultsStatLabel}>Duration</span>
                            </div>
                        </div>
                        <div className={styles.resultsActions}>
                            <Button onClick={() => { setGameResult(null); setCurrentIndex(0); setUserAnswer(''); setFeedback(null); setCorrectCount(0); setAttempts(0); setShowHint(false); }}>
                                Play Again
                            </Button>
                            <Button variant="secondary" onClick={() => navigate(`/sets/${setId}`)}>
                                Back to Set
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.writingGame}>
                <div className={styles.container}>
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading game...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (words.length === 0) {
        return (
            <div className={styles.writingGame}>
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
    const progressPercent = ((currentIndex + (feedback ? 1 : 0)) / words.length) * 100;
    const accuracy = attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0;

    return (
        <div className={`${styles.writingGame} ${mounted ? styles.mounted : ''}`}>
            <div className={styles.backgroundPattern}></div>

            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.title}>Writing Practice</h1>
                        <p className={styles.subtitle}>Type the correct word for each definition</p>
                    </div>
                    <div className={styles.statsContainer}>
                        <div className={styles.statBox}>
                            <span className={styles.statLabel}>Question</span>
                            <span className={styles.statValue}>
                                {currentIndex + 1}/{words.length}
                            </span>
                        </div>
                        <div className={styles.statBox}>
                            <span className={styles.statLabel}>Correct</span>
                            <span className={styles.statValue}>{correctCount}</span>
                        </div>
                        {attempts > 0 && (
                            <div className={styles.statBox}>
                                <span className={styles.statLabel}>Accuracy</span>
                                <span className={styles.statValue}>{accuracy}%</span>
                            </div>
                        )}
                    </div>
                </header>

                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>

                <Card className={styles.questionCard}>
                    <div className={styles.questionHeader}>
                        <div className={styles.questionNumber}>
                            Question {currentIndex + 1}
                        </div>
                        {currentWord.language && (
                            <div className={styles.languageBadge}>
                                {currentWord.language.name}
                            </div>
                        )}
                    </div>

                    <div className={styles.question}>
                        <h2 className={styles.questionTitle}>Write the word for:</h2>
                        <p className={styles.definition}>{currentWord.englishDefinition}</p>
                    </div>

                    {!feedback ? (
                        <>
                            <div className={styles.inputWrapper}>
                                <Input
                                    type="text"
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    placeholder="Type your answer here..."
                                    className={styles.answerInput}
                                    onKeyPress={handleKeyPress}
                                    autoFocus
                                    disabled={feedback !== null}
                                />
                                <div className={styles.inputHint}>
                                    Press Enter to submit
                                </div>
                            </div>

                            <div className={styles.actions}>
                                <Button
                                    variant="primary"
                                    onClick={checkAnswer}
                                    disabled={!userAnswer.trim()}
                                    className={styles.checkButton}
                                >
                                    Check Answer
                                </Button>

                                <Button
                                    variant="secondary"
                                    onClick={() => setShowHint(!showHint)}
                                    className={styles.hintButton}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                    </svg>
                                    {showHint ? 'Hide Hint' : 'Need a Hint?'}
                                </Button>

                                <Button
                                    variant="secondary"
                                    onClick={handleSkip}
                                    className={styles.skipButton}
                                >
                                    Skip
                                </Button>
                            </div>

                            {showHint && (
                                <Card className={styles.hintCard}>
                                    <div className={styles.hintHeader}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                                        </svg>
                                        <span>Hints</span>
                                    </div>
                                    {currentWord.ipa && (
                                        <div className={styles.hintItem}>
                                            <span className={styles.hintLabel}>Pronunciation:</span>
                                            <span className={styles.hintValue}>{currentWord.ipa}</span>
                                        </div>
                                    )}
                                    {currentWord.exampleSentence && (
                                        <div className={styles.hintItem}>
                                            <span className={styles.hintLabel}>Example:</span>
                                            <span className={styles.hintValue}>{currentWord.exampleSentence}</span>
                                        </div>
                                    )}
                                    {!currentWord.ipa && !currentWord.exampleSentence && (
                                        <p className={styles.noHints}>No hints available for this word</p>
                                    )}
                                </Card>
                            )}
                        </>
                    ) : (
                        <div className={`${styles.feedback} ${
                        feedback.correct ? styles.correct : styles.incorrect
                            }`}>
                            <div className={styles.feedbackIcon}>
                                {feedback.correct ? (
                                    <svg viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <h3 className={styles.feedbackTitle}>
                                {feedback.correct ? 'Correct!' : 'Not Quite Right'}
                            </h3>
                            {!feedback.correct && (
                                <div className={styles.answerComparison}>
                                    <div className={styles.comparisonItem}>
                                        <span className={styles.comparisonLabel}>Your answer:</span>
                                        <span className={styles.wrongAnswer}>{feedback.userAnswer || '(empty)'}</span>
                                    </div>
                                    <div className={styles.comparisonItem}>
                                        <span className={styles.comparisonLabel}>Correct answer:</span>
                                        <span className={styles.correctAnswerText}>{feedback.correctAnswer}</span>
                                    </div>
                                </div>
                            )}
                            {feedback.correct && (
                                <p className={styles.encouragement}>Great job! Keep it up!</p>
                            )}
                            <Button
                                variant="primary"
                                onClick={handleNext}
                                className={styles.nextButton}
                            >
                                {currentIndex === words.length - 1 ? (
                                    <>
                                        <span>Finish Game</span>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </>
                                ) : (
                                    <>
                                        <span>Next Question</span>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </Card>

                <div className={styles.footer}>
                    <Button
                        variant="secondary"
                        onClick={handleExit}
                        className={styles.exitButton}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Exit Practice
                    </Button>
                </div>
            </div>
        </div>
    );
}