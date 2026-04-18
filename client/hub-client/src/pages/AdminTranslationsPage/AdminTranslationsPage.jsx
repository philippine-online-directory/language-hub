import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { languageService } from '../../api/languageService';
import { translationUpdateRequestService } from '../../api/translationUpdateRequestService';
import Button from '../../components/Button/Button';
import WordDisplay from '../../components/WordDisplay/WordDisplay';
import UpdateWordDisplay from '../../components/UpdateWordDisplay/UpdateWordDisplay';
import styles from './AdminTranslationsPage.module.css';

// Inline confirmation dialog — avoids blocking window.confirm()
function DeleteConfirmModal({
  type,              
  targetLabel,        
  hasAudio,           
  onConfirm,
  onCancel,
  isDeleting
}) {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalIcon}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="28" height="28">
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className={styles.modalTitle}>
          {type === "TRANSLATION" ? "Delete Translation?" : "Delete Translation Update?"}
        </h3>
        <p className={styles.modalBody}>
          You are about to permanently delete {type === "TRANSLATION" ? "" : "the translation update for"} <strong>"{targetLabel}"</strong>.{" "}
          {hasAudio && " The associated audio file will also be removed from storage."}{" "}
          This action cannot be undone.
        </p>
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}


export default function AdminTranslationsPage(){
    const { user } = useAuth();
    const [languages, setLanguages] = useState([]);
    const [selectedLanguageIso, setSelectedLanguageIso] = useState(''); // ISO code
    const [selectedLanguageId, setSelectedLanguageId] = useState(''); // Database ID
    const [translations, setTranslations] = useState([]);
    const [translationUpdates, setTranslationUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [languagesLoading, setLanguagesLoading] = useState(true);
    const [filter, setFilter] = useState('UNVERIFIED');
    const [mounted, setMounted] = useState(false);
    // Delete state
    const [translationToDelete, setTranslationToDelete] = useState(null);
    const [translationUpdateToDelete, setTranslationUpdateToDelete] = useState(null);

    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchLanguages = async () => {
            setLanguagesLoading(true);
            try {
                const result = await languageService.getLanguages(1, 1000);
                const languagesList = result.languages || [];
                setLanguages(languagesList);
                if (languagesList.length > 0) {
                    setSelectedLanguageIso(languagesList[0].isoCode);
                    setSelectedLanguageId(languagesList[0].id);
                }
            } catch (err) {
                console.error('Error fetching languages:', err);
            } finally {
                setLanguagesLoading(false);
            }
        };
        fetchLanguages();
    }, []);

    useEffect(() => {
        if (selectedLanguageIso) {
            if (filter === 'UPDATE') {
                fetchTranslationUpdates();
            }
            else if (filter === 'ALL') {
                fetchTranslations();
                fetchTranslationUpdates();
            }
            else{
                fetchTranslations();
            }
        }
    }, [selectedLanguageIso, filter]);

    const fetchTranslations = async () => {
        setLoading(true);
        try {
            const result = await languageService.getTranslations(
                selectedLanguageIso,
                { status: filter, page: 1, limit: 1000 }
            );
            setTranslations(result.translations || []);
        } catch (err) {
            console.error('Error fetching translations:', err);
            setTranslations([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTranslationUpdates = async () => {
        setLoading(true);
        try {
            const result = await translationUpdateRequestService.getTranslationUpdateRequests(
                selectedLanguageId,
                1,                       // page
                1000                     // limit
            );
            setTranslationUpdates(result.requests || []);
        } catch (err) {
            console.error('Error fetching Translation Updates:', err);
            setTranslationUpdates([]);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (translationId) => {
        try {
            await languageService.updateTranslationStatus(
                selectedLanguageIso,
                translationId,
                'VERIFIED'
            );
            await fetchTranslations();
        } catch (err) {
            alert('Failed to verify translation');
            console.error('Error verifying translation:', err);
        }
    };

    const handleUnverify = async (translationId) => {
        try {
            await languageService.updateTranslationStatus(
                selectedLanguageIso,
                translationId,
                'UNVERIFIED'
            );
            await fetchTranslations();
        } catch (err) {
            alert('Failed to update translation');
            console.error('Error updating translation:', err);
        }
    };

    const handleApprove = async (updateRequestId) => {
        try {
            await translationUpdateRequestService.acceptTranslationUpdateRequest(updateRequestId);
            await fetchTranslationUpdates();
            await fetchTranslations();
        } catch (err) {
            alert('Failed to approve translation update');
            console.error('Error approving translation update:', err);
        }
    };

    const handleDeleteClick = (translation) => {
        setTranslationToDelete(translation);
    };

    const handleTranslationUpdateDeleteClick = (update) => {
        setTranslationUpdateToDelete(update);
    };

    const handleTranslationDeleteConfirm = async () => {
        if (!translationToDelete) return;
        setIsDeleting(true);
        try {
            await languageService.deleteTranslation(selectedLanguageIso, translationToDelete.id);
            // Optimistically remove from local list so we don't need a full refetch
            setTranslations((prev) => prev.filter((t) => t.id !== translationToDelete.id));
            setTranslationToDelete(null);
        } catch (err) {
            alert('Failed to delete translation. Please try again.');
            console.error('Error deleting translation:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleTranslationUpdateDeleteConfirm = async () => {
        if (!translationUpdateToDelete) return;
        setIsDeleting(true);
        try {
            await translationUpdateRequestService.deleteTranslationUpdateRequest(translationUpdateToDelete.id);
            // Optimistically remove from local list so we don't need a full refetch
            setTranslationUpdates((prev) => prev.filter((u) => u.id !== translationUpdateToDelete.id));
            setTranslationUpdateToDelete(null);
        } catch (err) {
            alert('Failed to delete translation. Please try again.');
            console.error('Error deleting translation:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        if (isDeleting) return;
        setTranslationUpdateToDelete(null);
        setTranslationToDelete(null);
    };

    if (user?.role !== 'ADMIN') {
        return (
            <div className={`${styles.adminTranslationsPage} ${mounted ? styles.mounted : ''}`}>
                <div className={styles.backgroundPattern}></div>
                <div className={styles.container}>
                    <div className={styles.unauthorized}>
                        <svg className={styles.unauthorizedIcon} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p>Unauthorized access</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.adminTranslationsPage} ${mounted ? styles.mounted : ''}`}>
            <div className={styles.backgroundPattern}></div>

            {translationToDelete && (
                <DeleteConfirmModal
                    type="TRANSLATION"
                    targetLabel={translationToDelete.wordText}
                    hasAudio={translationToDelete.audioUrl ? true : false}
                    onConfirm={handleTranslationDeleteConfirm}
                    onCancel={handleDeleteCancel}
                    isDeleting={isDeleting}
                />
            )}

            {translationUpdateToDelete && (
                <DeleteConfirmModal
                    type="UPDATE"
                    targetLabel={translationUpdateToDelete.translation.wordText}
                    hasAudio={translationUpdateToDelete.proposedData.audioUrl ? true : false}
                    onConfirm={handleTranslationUpdateDeleteConfirm}
                    onCancel={handleDeleteCancel}
                    isDeleting={isDeleting}
                />
            )}
            
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Verify Translations</h1>
                </header>

                <div className={styles.controls}>
                    <div className={styles.controlGroup}>
                        <label className={styles.label}>Language</label>
                        {languagesLoading ? (
                            <div className={styles.loadingSelect}>Loading languages...</div>
                        ) : (
                            <select
                              value={`${selectedLanguageIso}|${selectedLanguageId}`}
                              onChange={(e) => {
                                const [iso, id] = e.target.value.split("|");
                                setSelectedLanguageIso(iso);
                                setSelectedLanguageId(id);
                              }}
                              className={styles.select}
                            >
                              {languages.map((lang) => (
                                <option key={lang.id} value={`${lang.isoCode}|${lang.id}`}>
                                  {lang.name} ({lang.isoCode.toUpperCase()})
                                </option>
                              ))}
                            </select>
                        )}
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.radioLabel}>
                            <input
                                type="radio"
                                value="UNVERIFIED"
                                checked={filter === 'UNVERIFIED'}
                                onChange={(e) => setFilter(e.target.value)}
                                className={styles.radio}
                            />
                            <span>Unverified</span>
                        </label>
                        <label className={styles.radioLabel}>
                            <input
                                type="radio"
                                value="VERIFIED"
                                checked={filter === 'VERIFIED'}
                                onChange={(e) => setFilter(e.target.value)}
                                className={styles.radio}
                            />
                            <span>Verified</span>
                        </label>
                        <label className={styles.radioLabel}>
                            <input
                                type="radio"
                                value="UPDATE"
                                checked={filter === 'UPDATE'}
                                onChange={(e) => setFilter(e.target.value)}
                                className={styles.radio}
                            />
                            <span>Update</span>
                        </label>
                        <label className={styles.radioLabel}>
                            <input
                                type="radio"
                                value="ALL"
                                checked={filter === 'ALL'}
                                onChange={(e) => setFilter(e.target.value)}
                                className={styles.radio}
                            />
                            <span>All</span>
                        </label>
                    </div>
                </div>

                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Loading translations...</p>
                    </div>
                ) : (translations.length === 0 && filter !== 'UPDATE') || (filter === 'UPDATE' && translationUpdates.length === 0) ? (
                    <div className={styles.empty}>
                        <svg className={styles.emptyIcon} viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                        <p>No {filter.toLowerCase()} translations found for this language.</p>
                    </div>
                ) : (
                    <div className={styles.translationsGrid}>
                        {filter !== 'UPDATE' && (
                          translations.map((translation) => (
                              <div key={translation.id} className={styles.translationItem}>
                                <WordDisplay 
                                  translation={translation} 
                                  showAddToSet={false}
                                  defaultExpanded={false}
                                />
                                <div className={styles.adminActions}>
                                  {translation.status === 'UNVERIFIED' ? (
                                    <Button
                                      variant="primary"
                                      onClick={() => handleVerify(translation.id)}
                                    >
                                      Verify Translation
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="secondary"
                                      onClick={() => handleUnverify(translation.id)}
                                    >
                                      Mark as Unverified
                                    </Button>
                                  )}
                                  <Button
                                    variant="danger"
                                    onClick={() => handleDeleteClick(translation)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ))
                        )}

                        {(filter === 'UPDATE' || filter === 'ALL') && (
                          translationUpdates.map((update) => (
                              <div key={update.id} className={styles.translationItem}>
                                <UpdateWordDisplay 
                                  request={update} 
                                  defaultExpanded={false}
                                />
                                <div className={styles.adminActions}>
                                  <Button
                                    variant="primary"
                                    onClick={() => handleApprove(update.id)}
                                  >
                                    Approve Update
                                  </Button>
                                  <Button
                                    variant="danger"
                                    onClick={() => handleTranslationUpdateDeleteClick(update)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ))
                        )}                      
                    </div>
                )}
            </div>
        </div>
    );
}