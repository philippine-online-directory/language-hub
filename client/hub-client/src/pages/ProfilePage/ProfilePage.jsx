import { useState, useEffect, useRef } from 'react';
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
  const contentRef = useRef(null);

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

  // Scroll animation observer for grid items
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !contentRef.current) return;

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

    const items = contentRef.current.querySelectorAll(`.${styles.animateItem}`);
    items.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, [activeTab, profile]);

  const handleReminderChange = async (newReminderType) => {
    setProfile((prev) => ({ ...prev, reminderType: newReminderType }));

    try {
      await profileService.setMyProfile({ reminderType: newReminderType });
    } catch (err) {
      setError("Could not update reminder settings. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.container}>
          <div className={styles.errorState}>
            <p>{error || 'Profile not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      <div className={styles.container}>
        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.headerContent}>
            <div className={styles.profileInfo}>
              <h1 className={styles.username}>{profile.username}</h1>
              <p className={styles.email}>{profile.email}</p>
              {profile.role === 'ADMIN' && (
                <span className={styles.adminBadge}>Admin</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
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

        {/* Tabs */}
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
          <button
            className={`${styles.tab} ${activeTab === 'settings' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        {/* Content Sections */}
        <div className={styles.contentSection} ref={contentRef}>
          {activeTab === 'contributions' && (
            <>
              {profile.contributions?.length === 0 ? (
                <div className={styles.empty}>
                  <p>You haven't contributed any words yet.</p>
                  <Link to="/contribute" className={styles.emptyActionLink}>
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
                  {profile.contributions?.map((contribution, index) => (
                    <div 
                      key={contribution.id} 
                      className={styles.animateItem}
                      style={{ '--item-index': index }}
                    >
                      <WordDisplay 
                        translation={contribution}
                        showAddToSet={false}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'sets' && (
            <>
              {profile.createdSets?.length === 0 ? (
                <div className={styles.empty}>
                  <p>You haven't created any sets yet.</p>
                  <Link to="/sets/create" className={styles.emptyActionLink}>
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
                  {profile.createdSets?.map((set, index) => (
                    <Link 
                      key={set.id} 
                      to={`/sets/${set.id}`} 
                      className={`${styles.setLink} ${styles.animateItem}`}
                      style={{ '--item-index': index }}
                    >
                      <Card hoverable className={styles.setCard}>
                        <div className={styles.setHeader}>
                          <h3 className={styles.setName}>{set.name}</h3>
                          {set.isPublic && <span className={styles.publicBadge}>Public</span>}
                        </div>
                        {set.description && (
                          <p className={styles.setDescription}>{set.description}</p>
                        )}
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
            </>
          )}

          {activeTab === 'settings' && (
            <div className={`${styles.settingsSection} ${styles.headerContent}`}>
              <h2>Reminders</h2>
              <select
                className={styles.select}
                value={profile.reminderType ?? "NULL"} 
                onChange={(e) => {
                  const value = e.target.value === "NULL" ? null : e.target.value;
                  handleReminderChange(value);
                }}
              >
                <option value="NULL">No reminders</option>
                <option value="CHECKWORD">Check Word of the Day</option>
                <option value="WORD">Word of the Day</option>
              </select>

              {profile.reminderType === null && (
                <p key={profile.reminderType} className={styles.reminderExplanation}>
                  You won’t receive any reminder emails.
                </p>
              )}

              {profile.reminderType === "CHECKWORD" && (
                <p key={profile.reminderType} className={styles.reminderExplanation}>
                  If you haven’t looked at the Word of the Day yet, we’ll send you a gentle
                  reminder email encouraging you to check it out.
                </p>
              )}

              {profile.reminderType === "WORD" && (
                <p key={profile.reminderType} className={styles.reminderExplanation}>
                  You’ll get the Word of the Day delivered straight to your inbox each day,
                  so you never miss it.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}