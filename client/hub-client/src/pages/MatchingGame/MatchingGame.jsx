import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { setService } from '../../api/setService';
import { gameService } from '../../api/gameService';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import styles from './MatchingGame.module.css';

export default function MatchingGame(){
    const { setId } = useParams();
    const navigate = useNavigate();
    const [cards, setCards] = useState([]);
    const [selectedCards, setSelectedCards] = useState([]);
    const [matchedPairs, setMatchedPairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startTime] = useState(Date.now());
    const [moves, setMoves] = useState(0);

    useEffect(() => {
        const fetchWords = async () => {
            try {
                const data = await setService.getSetWords(setId);
                const words = data.setWords?.map(sw => sw.translation) || [];
                
                const shuffled = words.slice(0, 8);
                
                const gameCards = [];
                shuffled.forEach((word, idx) => {
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
        if (selectedCards.length >= 2) return;
        if (selectedCards.find(c => c.id === card.id)) return;
        if (matchedPairs.includes(card.pairId)) return;

        const newSelected = [...selectedCards, card];
        setSelectedCards(newSelected);

        if (newSelected.length === 2) {
            setMoves(prev => prev + 1);
            
            if (newSelected[0].pairId === newSelected[1].pairId) {
                setMatchedPairs([...matchedPairs, card.pairId]);
                setTimeout(() => setSelectedCards([]), 500);
                
                if (matchedPairs.length + 1 === cards.length / 2) {
                    setTimeout(() => handleFinish(), 1000);
                }
            } else {
                setTimeout(() => setSelectedCards([]), 1000);
            }
        }
    };

    const handleFinish = async () => {
        const duration = (Date.now() - startTime) / 1000;
        const score = Math.max(0, 100 - moves * 2);
        
        try {
            await gameService.uploadGameSession(setId, {
                gameType: 'MATCHING',
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
            <div className={styles.matchingGame}>
                <div className={styles.container}>
                    <div className={styles.loading}>Loading game...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.matchingGame}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Matching Game</h1>
                    <div className={styles.stats}>
                        <span>Matches: {matchedPairs.length} / {cards.length / 2}</span>
                        <span>Moves: {moves}</span>
                    </div>
                </header>

                <div className={styles.grid}>
                    {cards.map((card) => {
                        const isSelected = selectedCards.find(c => c.id === card.id);
                        const isMatched = matchedPairs.includes(card.pairId);
                        
                        return (
                            <Card
                                key={card.id}
                                onClick={() => handleCardClick(card)}
                                hoverable={!isMatched && !isSelected}
                                className={`${styles.matchCard} ${
                                    isSelected ? styles.selected : ''
                                } ${isMatched ? styles.matched : ''} ${
                                    card.type === 'word' ? styles.wordCard : styles.defCard
                                }`}
                            >
                                <div className={styles.cardContent}>
                                    {card.content}
                                </div>
                            </Card>
                        );
                    })}
                </div>

                <Button
                    variant="secondary"
                    onClick={() => navigate(`/sets/${setId}`)}
                    className={styles.exitButton}
                >
                    Exit Game
                </Button>
            </div>
        </div>
    );
}