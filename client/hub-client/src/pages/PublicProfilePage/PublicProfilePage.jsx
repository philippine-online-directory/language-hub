import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { profileService } from '../../api/profileService';
import Card from '../../components/Card/Card';
import WordDisplay from '../../components/WordDisplay/WordDisplay';
import styles from './PublicProfilePage.module.css';

export default function PublicProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('contributions');
  const [mounted, setMounted] = useState(false);
  const gridRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await profileService.getPublicProfile(userId);
        setProfile(data);
      } catch (err) {
        setError('Failed to load profile. Please try again.');
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // Scroll animation observer for grid items
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

    const items = gridRef.current.querySelectorAll(`.${styles.animateItem}`);
    items.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, [profile, activeTab]);

  if (loading) {
    return (
      <div className={styles.publicProfilePage}>
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
      <div className={styles.publicProfilePage}>
        <div className={styles.container}>
          <div className={styles.errorState}>
            <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p>{error || 'Profile not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className={`${styles.publicProfilePage} ${mounted ? styles.mounted : ''}`}>
      <div className={styles.backgroundPattern}></div>
      
      <div className={styles.container}>
        {/* Profile Header Card */}
        <Card className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.avatarSection}>
              <div className={styles.avatar}>
                <span className={styles.avatarText}>
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className={styles.profileInfo}>
                <div className={styles.nameRow}>
                  <h1 className={styles.username}>{profile.username}</h1>
                  {profile.role === 'ADMIN' && (
                    <span className={styles.adminBadge}>
                      <svg className={styles.badgeIcon} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Admin
                    </span>
                  )}
                </div>
                <p className={styles.joinDate}>
                  <svg className={styles.joinIcon} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Joined {joinDate}
                </p>
              </div>
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              </div>
              <span className={styles.statValue}>
                {profile._count?.contributions || 0}
              </span>
              <span className={styles.statLabel}>Contributions</span>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
              </div>
              <span className={styles.statValue}>
                {profile._count?.createdSets || 0}
              </span>
              <span className={styles.statLabel}>Sets Created</span>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'contributions' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('contributions')}
          >
            <svg className={styles.tabIcon} viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            Contributions ({profile.contributions?.length || 0})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'sets' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('sets')}
          >
            <svg className={styles.tabIcon} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
            </svg>
            Public Sets ({profile.createdSets?.filter(s => s.isPublic).length || 0})
          </button>
        </div>

        {/* Contributions Tab */}
        {activeTab === 'contributions' && (
          <div className={styles.contentSection}>
            {profile.contributions?.length === 0 ? (
              <div className={styles.empty}>
                <svg className={styles.emptyIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                <p>No contributions yet</p>
              </div>
            ) : (
              <div className={styles.contributionsGrid} ref={gridRef}>
                {profile.contributions?.map((contribution, index) => (
                  <div 
                    key={contribution.id}
                    className={styles.animateItem}
                    style={{ '--item-index': index }}
                  >
                    <WordDisplay 
                      translation={contribution}
                      showAddToSet={false}
                      defaultExpanded={false}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sets Tab */}
        {activeTab === 'sets' && (
          <div className={styles.contentSection}>
            {profile.createdSets?.filter(s => s.isPublic).length === 0 ? (
              <div className={styles.empty}>
                <svg className={styles.emptyIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                </svg>
                <p>No public sets</p>
              </div>
            ) : (
              <div className={styles.setsGrid} ref={gridRef}>
                {profile.createdSets?.filter(s => s.isPublic).map((set, index) => (
                  <div
                    key={set.id}
                    className={styles.animateItem}
                    style={{ '--item-index': index }}
                  >
                    <Link to={`/sets/${set.id}`} className={styles.setLink}>
                      <Card hoverable className={styles.setCard}>
                        <div className={styles.setHeader}>
                          <h3 className={styles.setName}>{set.name}</h3>
                          <span className={styles.publicBadge}>
                            <svg className={styles.badgeIcon} viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                            </svg>
                            Public
                          </span>
                        </div>
                        <p className={styles.setDescription}>{set.description}</p>
                        <div className={styles.setMeta}>
                          <span className={styles.metaItem}>
                            <svg className={styles.metaIcon} viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                            </svg>
                            {set._count?.setWords || 0} words
                          </span>
                          {set.language && (
                            <span className={styles.metaItem}>
                              <svg className={styles.metaIcon} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
                              </svg>
                              {set.language.name}
                            </span>
                          )}
                        </div>
                      </Card>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}