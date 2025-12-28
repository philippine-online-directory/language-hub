import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { profileService } from '../../api/profileService';
import Card from '../../components/Card/Card';
import WordDisplay from '../../components/WordDisplay/WordDisplay';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('contributions');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await profileService.getMyProfile();
        setProfile(data);
      } catch (err) {
        setError('Failed to load profile. Please try again.');
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.container}>
          <div className={styles.error}>{error || 'Profile not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      <div className={styles.container}>
        <Card className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.profileInfo}>
              <h1 className={styles.username}>{profile.username}</h1>
              <p className={styles.email}>{profile.email}</p>
              {profile.role === 'ADMIN' && (
                <span className={styles.adminBadge}>Admin</span>
              )}
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>
                {profile._count?.contributions || 0}
              </span>
              <span className={styles.statLabel}>Contributions</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>
                {profile._count?.createdSets || 0}
              </span>
              <span className={styles.statLabel}>Sets Created</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>
                {profile._count?.gameScores || 0}
              </span>
              <span className={styles.statLabel}>Games Played</span>
            </div>
          </div>
        </Card>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'contributions' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('contributions')}
          >
            Contributions ({profile.contributions?.length || 0})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'sets' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('sets')}
          >
            My Sets ({profile.createdSets?.length || 0})
          </button>
        </div>

        {activeTab === 'contributions' && (
          <div className={styles.contentSection}>
            {profile.contributions?.length === 0 ? (
              <div className={styles.empty}>
                <p>You haven't contributed any words yet.</p>
                <Link to="/contribute">
                  <Card hoverable className={styles.actionCard}>
                    <h3 className={styles.actionTitle}>Start Contributing</h3>
                    <p className={styles.actionDescription}>
                      Share words to help preserve languages
                    </p>
                  </Card>
                </Link>
              </div>
            ) : (
              <div className={styles.contributionsGrid}>
                {profile.contributions?.map((contribution) => (
                  <WordDisplay 
                    key={contribution.id} 
                    translation={contribution}
                    showAddToSet={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sets' && (
          <div className={styles.contentSection}>
            {profile.createdSets?.length === 0 ? (
              <div className={styles.empty}>
                <p>You haven't created any sets yet.</p>
                <Link to="/sets/create">
                  <Card hoverable className={styles.actionCard}>
                    <h3 className={styles.actionTitle}>Create Your First Set</h3>
                    <p className={styles.actionDescription}>
                      Build vocabulary collections for learning
                    </p>
                  </Card>
                </Link>
              </div>
            ) : (
              <div className={styles.setsGrid}>
                {profile.createdSets?.map((set) => (
                  <Link key={set.id} to={`/sets/${set.id}`} className={styles.setLink}>
                    <Card hoverable className={styles.setCard}>
                      <div className={styles.setHeader}>
                        <h3 className={styles.setName}>{set.name}</h3>
                        {set.isPublic && <span className={styles.publicBadge}>Public</span>}
                      </div>
                      <p className={styles.setDescription}>{set.description}</p>
                      <div className={styles.setMeta}>
                        <span className={styles.metaItem}>
                          {set._count?.setWords || 0} words
                        </span>
                        {set.language && (
                          <span className={styles.metaItem}>
                            {set.language.name}
                          </span>
                        )}
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}