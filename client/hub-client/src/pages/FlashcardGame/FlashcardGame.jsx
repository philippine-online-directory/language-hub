import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { setService } from '../../api/setService';
import { gameService } from '../../api/gameService';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import styles from './FlashcardGame.module.css';

export default function FlashcardGame(){
    const { setId } = useParams();
    const navigate = useNavigate();
    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [loading, setLoading] = useState(true);
    const [startTime] = useState(Date.now());
    const [score, setScore] = useState(0);

    useEffect(() => {
        const fetchWords = async () => {
            try {
                const data = await setService.getSetWords(setId);
                const translationsList = data.setWords?.map(sw => sw.translation) || [];
                
                const shuffled = [...translationsList].sort(() => Math.random() - 0.5);
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
            setScore(prev => prev + 1);
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
        const duration = (Date.now() - startTime) / 1000;
        
        try {
            await gameService.uploadGameSession(setId, {
                gameType: 'FLASHCARD',
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
            <div className={styles.flashcardGame}>
                <div className={styles.container}>
                    <div className={styles.loading}>Loading flashcards...</div>
                </div>
            </div>
        );
    }

    if (words.length === 0) {
        return (
            <div className={styles.flashcardGame}>
                <div className={styles.container}>
                    <div className={styles.empty}>No words available</div>
                </div>
            </div>
        );
    }

    const currentWord = words[currentIndex];

    return (
        <div className={styles.flashcardGame}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Flashcards</h1>
                    <div className={styles.progress}>
                        {currentIndex + 1} / {words.length}
                    </div>
                </header>

                <div className={styles.cardContainer}>
                    <Card 
                        className={`${styles.flashcard} ${isFlipped ? styles.flipped : ''}`}
                        onClick={handleFlip}
                    >
                        {!isFlipped ? (
                            <div className={styles.cardFront}>
                                <h2 className={styles.wordText}>{currentWord.wordText}</h2>
                                {currentWord.ipa && (
                                    <p className={styles.ipa}>{currentWord.ipa}</p>
                                )}
                                <p className={styles.hint}>Click to see definition</p>
                            </div>
                        ) : (
                            <div className={styles.cardBack}>
                                <p className={styles.definition}>
                                    {currentWord.englishDefinition}
                                </p>
                                <p className={styles.hint}>Click to flip back</p>
                            </div>
                        )}
                    </Card>

                    {isFlipped && (
                        <div className={styles.detailsSection}>
                            <Button
                                variant="secondary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDetails(!showDetails);
                                }}
                            >
                                {showDetails ? 'Hide Details' : 'Show Details'}
                            </Button>

                            {showDetails && (
                                <Card className={styles.detailsCard}>
                                    {currentWord.ipa && (
                                        <div className={styles.detailItem}>
                                            <h3 className={styles.detailsTitle}>Pronunciation</h3>
                                            <p className={styles.detailText}>{currentWord.ipa}</p>
                                        </div>
                                    )}
                                    {currentWord.exampleSentence && (
                                        <div className={styles.detailItem}>
                                            <h3 className={styles.detailsTitle}>Example</h3>
                                            <p className={styles.detailText}>{currentWord.exampleSentence}</p>
                                        </div>
                                    )}
                                </Card>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.controls}>
                    <Button
                        variant="secondary"
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                    >
                        Previous
                    </Button>

                    <Button
                        variant="primary"
                        onClick={handleNext}
                    >
                        {currentIndex === words.length - 1 ? 'Finish' : 'Next'}
                    </Button>
                </div>

                <Button
                    variant="secondary"
                    onClick={handleFinish}
                    className={styles.exitButton}
                >
                    Exit
                </Button>
            </div>
        </div>
    );
}