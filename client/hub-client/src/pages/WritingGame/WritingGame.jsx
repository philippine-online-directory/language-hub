import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { setService } from '../../api/setService';
import { gameService } from '../../api/gameService';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import Input from '../../components/Input/Input';
import styles from './WritingGame.module.css';

export default function WritingGame(){
    const { setId } = useParams();
    const navigate = useNavigate();
    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);
    const [startTime] = useState(Date.now());
    const [correctCount, setCorrectCount] = useState(0);
    const [showHint, setShowHint] = useState(false);

    useEffect(() => {
        const fetchWords = async () => {
            try {
                const data = await setService.getSetWords(setId);
                const translationsList = data.setWords?.map(sw => sw.translation) || [];
                
                const shuffled = [...translationsList].sort(() => Math.random() - 0.5);
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
        const correct = userAnswer.trim().toLowerCase() === 
                       currentWord.wordText.trim().toLowerCase();
        
        setFeedback({
            correct,
            correctAnswer: currentWord.wordText,
        });

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

    const handleFinish = async () => {
        const duration = (Date.now() - startTime) / 1000;
        const score = Math.round((correctCount / words.length) * 100);
        
        try {
            await gameService.uploadGameSession(setId, {
                gameType: 'WRITING',
                score,
                duration,
            });
        } catch (err) {
            console.error('Error saving game session:', err);
        }
        
        navigate(`/sets/${setId}`);
    };

    if (loading) {
        return (
            <div className={styles.writingGame}>
                <div className={styles.container}>
                    <div className={styles.loading}>Loading game...</div>
                </div>
            </div>
        );
    }

    if (words.length === 0) {
        return (
            <div className={styles.writingGame}>
                <div className={styles.container}>
                    <div className={styles.empty}>No words available</div>
                </div>
            </div>
        );
    }

    const currentWord = words[currentIndex];

    return (
        <div className={styles.writingGame}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Writing Practice</h1>
                    <div className={styles.progress}>
                        <span>Question {currentIndex + 1} / {words.length}</span>
                        <span>Score: {correctCount} / {currentIndex + (feedback ? 1 : 0)}</span>
                    </div>
                </header>

                <Card className={styles.questionCard}>
                    <div className={styles.question}>
                        <h2 className={styles.questionTitle}>Write the word for:</h2>
                        <p className={styles.definition}>{currentWord.englishDefinition}</p>
                    </div>

                    {!feedback && (
                        <>
                            <Input
                                type="text"
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                placeholder="Type your answer..."
                                className={styles.answerInput}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && userAnswer.trim()) {
                                        checkAnswer();
                                    }
                                }}
                                autoFocus
                            />

                            <div className={styles.actions}>
                                <Button
                                    variant="primary"
                                    onClick={checkAnswer}
                                    disabled={!userAnswer.trim()}
                                >
                                    Check Answer
                                </Button>
                                
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowHint(!showHint)}
                                >
                                    {showHint ? 'Hide Hint' : 'Show Hint'}
                                </Button>
                            </div>

                            {showHint && (
                                <Card className={styles.hintCard}>
                                    {currentWord.ipa && (
                                        <p className={styles.hint}>
                                            Pronunciation: {currentWord.ipa}
                                        </p>
                                    )}
                                    {currentWord.exampleSentence && (
                                        <p className={styles.hint}>
                                            Used in: {currentWord.exampleSentence}
                                        </p>
                                    )}
                                </Card>
                            )}
                        </>
                    )}

                    {feedback && (
                        <div className={`${styles.feedback} ${
                            feedback.correct ? styles.correct : styles.incorrect
                        }`}>
                            <h3 className={styles.feedbackTitle}>
                                {feedback.correct ? 'Correct!' : 'Not quite'}
                            </h3>
                            {!feedback.correct && (
                                <p className={styles.correctAnswer}>
                                    The correct answer is: <strong>{feedback.correctAnswer}</strong>
                                </p>
                            )}
                            <Button
                                variant="primary"
                                onClick={handleNext}
                                className={styles.nextButton}
                            >
                                {currentIndex === words.length - 1 ? 'Finish' : 'Next Question'}
                            </Button>
                        </div>
                    )}
                </Card>

                <Button
                    variant="secondary"
                    onClick={handleFinish}
                    className={styles.exitButton}
                >
                    Exit Game
                </Button>
            </div>
        </div>
    );
}