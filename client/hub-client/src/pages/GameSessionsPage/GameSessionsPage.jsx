import { useState, useEffect, useRef } from 'react';
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
  const [mounted, setMounted] = useState(false);
  const gridRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [setData, sessionsData] = await Promise.all([
          setService.getSetById(setId),
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

  // Scroll animation observer
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !gridRef.current) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.visible);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      const items = gridRef.current?.querySelectorAll(`.${styles.animateItem}`);
      if (!items) return;
      
      items.forEach(item => {
        // Check if item is already in viewport
        const rect = item.getBoundingClientRect();
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isInViewport) {
          // Immediately add visible class for items already in view
          item.classList.add(styles.visible);
        } else {
          // Observe items not yet in view
          observer.observe(item);
        }
      });
    }, 50);

    return () => observer.disconnect();
  }, [sessions, filterType]); // Use state values instead of computed value

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const getGameTypeLabel = (type) => {
    const labels = {
      FLASHCARD: 'Flashcards',
      MATCHING: 'Matching',
      WRITING: 'Writing',
    };
    return labels[type] || type;
  };

  const getGameTypeIcon = (type) => {
    switch(type) {
      case 'FLASHCARD':
        return (
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
          </svg>
        );
      case 'MATCHING':
        return (
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        );
      case 'WRITING':
        return (
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getAverageScore = () => {
    if (filteredSessions.length === 0) return 0;
    const total = filteredSessions.reduce((sum, s) => sum + s.score, 0);
    return Math.round(total / filteredSessions.length);
  };

  const getTotalDuration = () => {
    const total = filteredSessions.reduce((sum, s) => sum + s.duration, 0);
    return formatDuration(total);
  };

  if (loading) {
    return (
      <div className={styles.gameSessionsPage}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.gameSessionsPage}>
        <div className={styles.container}>
          <div className={styles.error}>
            <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.gameSessionsPage} ${mounted ? styles.mounted : ''}`}>
      <div className={styles.backgroundPattern}></div>
      
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <Link to={`/sets/${setId}`} className={styles.backLink}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              Back to {set?.name}
            </Link>
            <h1 className={styles.title}>Practice History</h1>
            <p className={styles.subtitle}>
              Track your progress and review past game sessions
            </p>
          </div>

          {filteredSessions.length > 0 && (
            <div className={styles.statsOverview}>
              <div className={styles.overviewStat}>
                <span className={styles.overviewLabel}>Total Sessions</span>
                <span className={styles.overviewValue}>{filteredSessions.length}</span>
              </div>
              <div className={styles.overviewStat}>
                <span className={styles.overviewLabel}>Avg Score</span>
                <span className={styles.overviewValue}>{getAverageScore()}</span>
              </div>
              <div className={styles.overviewStat}>
                <span className={styles.overviewLabel}>Total Time</span>
                <span className={styles.overviewValue}>{getTotalDuration()}</span>
              </div>
            </div>
          )}
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
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
            Flashcards
          </button>
          <button
            className={`${styles.filterButton} ${filterType === 'MATCHING' ? styles.active : ''}`}
            onClick={() => setFilterType('MATCHING')}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            Matching
          </button>
          <button
            className={`${styles.filterButton} ${filterType === 'WRITING' ? styles.active : ''}`}
            onClick={() => setFilterType('WRITING')}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Writing
          </button>
        </div>

        {filteredSessions.length === 0 ? (
          <div className={styles.empty}>
            <svg className={styles.emptyIcon} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p>
              {filterType === 'ALL' 
                ? 'No game sessions yet. Start practicing to track your progress!'
                : `No ${getGameTypeLabel(filterType)} sessions found.`
              }
            </p>
            <Link to={`/sets/${setId}`} className={styles.emptyButton}>
              Start Practicing
            </Link>
          </div>
        ) : (
          <div className={styles.sessionsGrid} ref={gridRef}>
            {filteredSessions.map((session, index) => (
              <div
                key={session.id}
                className={styles.animateItem}
                style={{ '--item-index': index }}
              >
                <Card className={styles.sessionCard}>
                  <div className={styles.sessionHeader}>
                    <div className={styles.gameTypeInfo}>
                      <div className={styles.gameIcon}>
                        {getGameTypeIcon(session.gameType)}
                      </div>
                      <h3 className={styles.gameType}>
                        {getGameTypeLabel(session.gameType)}
                      </h3>
                    </div>
                    <span className={styles.date}>
                      {new Date(session.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
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
                  <div className={styles.scoreBar}>
                    <div 
                      className={styles.scoreBarFill} 
                      style={{ width: `${session.score}%` }}
                    ></div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}