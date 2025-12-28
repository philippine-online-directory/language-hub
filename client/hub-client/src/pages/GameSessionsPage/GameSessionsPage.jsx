import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { gameService } from '../../api/gameService';
import { setService } from '../../api/setService';
import Card from '../../components/Card/Card';
import styles from './GameSessionsPage.module.css';

export default function GameSessionsPage() {
  const { setId } = useParams();
  const [set, setSet] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [setData, sessionsData] = await Promise.all([
          setService.getSetWords(setId),
          gameService.getGameSessions(setId),
        ]);
        setSet(setData);
        setSessions(sessionsData);
      } catch (err) {
        setError('Failed to load game sessions. Please try again.');
        console.error('Error fetching game sessions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setId]);

  const filteredSessions = filterType === 'ALL' 
    ? sessions 
    : sessions.filter((s) => s.gameType === filterType);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const getGameTypeLabel = (type) => {
    const labels = {
      FLASHCARD: 'Flashcards',
      MATCHING: 'Matching',
      QUIZ: 'Writing',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className={styles.gameSessionsPage}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading sessions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.gameSessionsPage}>
        <div className={styles.container}>
          <div className={styles.error}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gameSessionsPage}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <Link to={`/sets/${setId}`} className={styles.backLink}>
              ← Back to {set?.name}
            </Link>
            <h1 className={styles.title}>Game Sessions</h1>
            <p className={styles.subtitle}>
              View your practice history for this set
            </p>
          </div>
        </header>

        <div className={styles.filters}>
          <button
            className={`${styles.filterButton} ${filterType === 'ALL' ? styles.active : ''}`}
            onClick={() => setFilterType('ALL')}
          >
            All Sessions
          </button>
          <button
            className={`${styles.filterButton} ${filterType === 'FLASHCARD' ? styles.active : ''}`}
            onClick={() => setFilterType('FLASHCARD')}
          >
            Flashcards
          </button>
          <button
            className={`${styles.filterButton} ${filterType === 'MATCHING' ? styles.active : ''}`}
            onClick={() => setFilterType('MATCHING')}
          >
            Matching
          </button>
          <button
            className={`${styles.filterButton} ${filterType === 'QUIZ' ? styles.active : ''}`}
            onClick={() => setFilterType('QUIZ')}
          >
            Writing
          </button>
        </div>

        {filteredSessions.length === 0 ? (
          <div className={styles.empty}>
            {filterType === 'ALL' 
              ? 'No game sessions found. Start practicing to see your progress!'
              : `No ${getGameTypeLabel(filterType)} sessions found.`
            }
          </div>
        ) : (
          <div className={styles.sessionsGrid}>
            {filteredSessions.map((session) => (
              <Card key={session.id} className={styles.sessionCard}>
                <div className={styles.sessionHeader}>
                  <h3 className={styles.gameType}>
                    {getGameTypeLabel(session.gameType)}
                  </h3>
                  <span className={styles.date}>
                    {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.sessionStats}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Score</span>
                    <span className={styles.statValue}>{session.score}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Duration</span>
                    <span className={styles.statValue}>
                      {formatDuration(session.duration)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}