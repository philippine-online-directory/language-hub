import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { setService } from '../../api/setService';
import { useAuth } from '../../context/AuthContext';
import WordDisplay from '../../components/WordDisplay/WordDisplay';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal/ConfirmDeleteModal';
import Pagination from '../../components/Pagination/Pagination';
import { clearJsonLd, setJsonLd, setRobotsDirective } from '../../utils/seoMeta';
import styles from './SetDetailPage.module.css';

const WORDS_PER_PAGE = 20;

export default function SetDetailPage() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [set, setSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [wordsPage, setWordsPage] = useState(1);
  const [wordsPagination, setWordsPagination] = useState(null);

  useEffect(() => {
    setWordsPage(1);
  }, [setId]);

  useEffect(() => {
    const fetchSet = async () => {
      setLoading(true);
      setError(null);
      try {
        const [setInfo, translations] = await Promise.all([
          setService.getSetById(setId),
          setService.getSetWords(setId, { page: wordsPage, limit: WORDS_PER_PAGE })
        ]);
        const combinedData = {
          ...setInfo,
          setWords: (translations.translations || []).map(translation => ({ translation }))
        };
        setSet(combinedData);
        setWordsPagination(translations.pagination || null);
      } catch (err) {
        setError('Failed to load set. Please try again.');
        console.error('Error fetching set:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSet();
  }, [setId, wordsPage]);

  useEffect(() => {
    if (!loading && (error || !set)) {
      setRobotsDirective('noindex,follow');
    }
  }, [loading, error, set]);

  useEffect(() => {
    if (!set) return;

    const url = `https://www.philippineonlinedictionary.com/sets/${set.id}`;
    setJsonLd('pod-page-jsonld', {
      '@type': 'CreativeWork',
      '@id': `${url}#vocabulary-set`,
      name: set.name,
      description: set.description,
      url,
      about: set.language ? {
        '@type': 'Language',
        name: set.language.name,
        alternateName: set.language.isoCode || undefined,
      } : undefined,
      author: set.owner ? {
        '@type': 'Person',
        name: set.owner.username,
        url: `https://www.philippineonlinedictionary.com/profile/${set.owner.id}`,
      } : undefined,
    });

    return () => clearJsonLd('pod-page-jsonld');
  }, [set]);

  const handleRemoveConfirm = async () => {
    if (!pendingRemove) return;
    try {
      await setService.removeTranslationFromSet(setId, pendingRemove.id);
      setSet({
        ...set,
        setWords: set.setWords.filter((sw) => sw.translation.id !== pendingRemove.id),
      });
      setPendingRemove(null);
    } catch (err) {
      alert('Failed to remove word. Please try again.');
      console.error('Error removing word:', err);
    }
  };

  const handlePublishToggle = async () => {
    setIsPublishing(true);
    try {
      const updatedSet = await setService.publishSet(setId, {
        name: set.name,
        description: set.description,
        isPublic: !set.isPublic,
      });
      setSet({ ...set, isPublic: updatedSet.isPublic });
    } catch (err) {
      alert('Failed to update set visibility. Please try again.');
      console.error('Error updating set:', err);
    } finally {
      setIsPublishing(false);
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

  const isOwner = user && set.owner?.username === user.username;
  const wordCount = set._count?.setWords ?? set.setWords?.length ?? 0;
  const hasWords = wordCount > 0;
  const gameOptions = [
    {
      key: 'flashcard',
      title: 'Flashcards',
      description: 'Review each word at your own pace.',
      to: `/sets/${setId}/games/flashcard`,
    },
    {
      key: 'matching',
      title: 'Matching',
      description: 'Pair words with the right translation.',
      to: `/sets/${setId}/games/matching`,
    },
    {
      key: 'writing',
      title: 'Writing',
      description: 'Type answers from memory.',
      to: `/sets/${setId}/games/writing`,
    },
  ];

  return (
    <div className={styles.setDetailPage}>
      {pendingRemove && (
        <ConfirmDeleteModal
          itemType="Word"
          itemName={pendingRemove.wordText}
          onConfirm={handleRemoveConfirm}
          onCancel={() => setPendingRemove(null)}
        />
      )}
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerTop}>
              <h1 className={styles.setName}>{set.name}</h1>
              {set.isPublic && <span className={styles.publicBadge}>Public</span>}
            </div>
            {set.description && <p className={styles.setDescription}>{set.description}</p>}
            <div className={styles.meta}>
              <span className={styles.metaItem}>
                {wordCount} words
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
                loading={isPublishing}
              >
                {set.isPublic ? 'Make Private' : 'Publish Set'}
              </Button>
            </div>
          )}
        </header>

        {hasWords && (
          <Card className={styles.gamesCard}>
            <div className={styles.gamesHeader}>
              <div>
                <span className={styles.gamesEyebrow}>Ready to practice</span>
                <h2 className={styles.sectionTitle}>Choose a game for this set</h2>
                <p className={styles.gamesDescription}>
                  Games use the {wordCount} words saved in this set.
                </p>
              </div>
              <Link to={`/sets/${setId}/sessions`} className={styles.viewSessions}>
                View practice history
              </Link>
            </div>
            <div className={styles.gameOptions}>
              {gameOptions.map((game) => (
                <button
                  key={game.key}
                  type="button"
                  className={styles.gameOption}
                  onClick={() => navigate(game.to)}
                >
                  <span className={styles.gameOptionTitle}>{game.title}</span>
                  <span className={styles.gameOptionDescription}>{game.description}</span>
                  <span className={styles.gameOptionAction}>
                    Play
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L13.586 10H4a1 1 0 110-2h9.586l-3.293-3.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          </Card>
        )}

        <section className={styles.wordsSection}>
          <h2 className={styles.sectionTitle}>Words in This Set</h2>
          
          {!hasWords ? (
            <div className={styles.empty}>
              <p>No words in this set yet.</p>
              {isOwner && (
                <p className={styles.emptyHint}>
                  Start adding translations to this set from the{' '}
                  <Link
                    to={set.language ? `/languages/${set.language.slug}` : '/languages'}
                    className={styles.emptyLink}
                  >
                    {set.language ? `${set.language.name} dictionary here` : 'Dictionaries page'}
                  </Link>
                  {' '}— expand any word card and click &ldquo;Add to Set&rdquo;.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className={styles.wordsGrid}>
                {set.setWords.map(({ translation }) => (
                  <div key={translation.id} className={styles.wordItem}>
                    <WordDisplay translation={translation} showAddToSet={false} expanded={expandedId === translation.id} onToggle={setExpandedId} />
                    {isOwner && (
                      <Button
                        variant="secondary"
                        onClick={() => setPendingRemove({ id: translation.id, wordText: translation.wordText })}
                        className={styles.removeButton}
                      >
                        Remove from Set
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {wordsPagination && wordsPagination.totalPages > 1 && (
                <Pagination
                  currentPage={wordsPage}
                  totalPages={wordsPagination.totalPages}
                  onPageChange={setWordsPage}
                  totalItems={wordsPagination.total}
                  itemsPerPage={wordsPagination.limit}
                />
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
