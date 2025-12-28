import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { setService } from '../../api/setService';
import { useAuth } from '../../context/AuthContext';
import WordDisplay from '../../components/WordDisplay/WordDisplay';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import styles from './SetDetailPage.module.css';

export default function SetDetailPage() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [set, setSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSet = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await setService.getSetWords(setId);
        setSet(data);
      } catch (err) {
        setError('Failed to load set. Please try again.');
        console.error('Error fetching set:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSet();
  }, [setId]);

  const handleRemoveWord = async (translationId) => {
    if (!window.confirm('Remove this word from the set?')) {
      return;
    }

    try {
      await setService.removeTranslationFromSet(setId, translationId);
      setSet({
        ...set,
        setWords: set.setWords.filter((sw) => sw.translation.id !== translationId),
      });
    } catch (err) {
      alert('Failed to remove word. Please try again.');
      console.error('Error removing word:', err);
    }
  };

  const handlePublishToggle = async () => {
    try {
      const updatedSet = await setService.publishSet(setId, {
        ...set,
        isPublic: !set.isPublic,
      });
      setSet({ ...set, isPublic: updatedSet.isPublic });
    } catch (err) {
      alert('Failed to update set visibility. Please try again.');
      console.error('Error updating set:', err);
    }
  };

  if (loading) {
    return (
      <div className={styles.setDetailPage}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading set...</div>
        </div>
      </div>
    );
  }

  if (error || !set) {
    return (
      <div className={styles.setDetailPage}>
        <div className={styles.container}>
          <div className={styles.error}>{error || 'Set not found'}</div>
        </div>
      </div>
    );
  }

  const isOwner = user && set.ownerId === user.id;
  const hasWords = set.setWords && set.setWords.length > 0;

  return (
    <div className={styles.setDetailPage}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerTop}>
              <h1 className={styles.setName}>{set.name}</h1>
              {set.isPublic && <span className={styles.publicBadge}>Public</span>}
            </div>
            <p className={styles.setDescription}>{set.description}</p>
            <div className={styles.meta}>
              <span className={styles.metaItem}>
                {set.setWords?.length || 0} words
              </span>
              {set.language && (
                <span className={styles.metaItem}>{set.language.name}</span>
              )}
              {set.owner && (
                <span className={styles.metaItem}>by {set.owner.username}</span>
              )}
            </div>
          </div>
          
          {isOwner && (
            <div className={styles.actions}>
              <Button
                variant="secondary"
                onClick={() => navigate(`/sets/${setId}/edit`)}
              >
                Edit Set
              </Button>
              <Button
                variant={set.isPublic ? 'secondary' : 'primary'}
                onClick={handlePublishToggle}
              >
                {set.isPublic ? 'Make Private' : 'Publish Set'}
              </Button>
            </div>
          )}
        </header>

        {hasWords && (
          <Card className={styles.gamesCard}>
            <h2 className={styles.sectionTitle}>Practice with Games</h2>
            <p className={styles.gamesDescription}>
              Test your knowledge with interactive learning games
            </p>
            <div className={styles.gameButtons}>
              <Button 
                variant="primary"
                onClick={() => navigate(`/sets/${setId}/games/flashcard`)}
              >
                Flashcards
              </Button>
              <Button 
                variant="primary"
                onClick={() => navigate(`/sets/${setId}/games/matching`)}
              >
                Matching
              </Button>
              <Button 
                variant="primary"
                onClick={() => navigate(`/sets/${setId}/games/writing`)}
              >
                Writing
              </Button>
            </div>
            <Link to={`/sets/${setId}/sessions`} className={styles.viewSessions}>
              View past game sessions
            </Link>
          </Card>
        )}

        <section className={styles.wordsSection}>
          <h2 className={styles.sectionTitle}>Words in This Set</h2>
          
          {!hasWords ? (
            <div className={styles.empty}>
              <p>No words in this set yet.</p>
              {isOwner && (
                <p className={styles.emptyHint}>
                  Browse languages and add words using the "Add to Set" button on word cards.
                </p>
              )}
            </div>
          ) : (
            <div className={styles.wordsGrid}>
              {set.setWords.map(({ translation }) => (
                <div key={translation.id} className={styles.wordItem}>
                  <WordDisplay translation={translation} showAddToSet={false} />
                  {isOwner && (
                    <Button
                      variant="secondary"
                      onClick={() => handleRemoveWord(translation.id)}
                      className={styles.removeButton}
                    >
                      Remove from Set
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}