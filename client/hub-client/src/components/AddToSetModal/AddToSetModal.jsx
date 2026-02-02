import { useState, useEffect } from 'react';
import { setService } from '../../api/setService';
import Button from '../Button/Button';
import Card from '../Card/Card';
import styles from './AddToSetModal.module.css';

export default function AddToSetModal({ translation, mode = 'add', setsContainingTranslation = [], onClose }){
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSetId, setSelectedSetId] = useState('');
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const isRemoveMode = mode === 'remove';

    useEffect(() => {
        const fetchSets = async () => {
            setLoading(true);
            try {
                if (isRemoveMode) {
                    // In remove mode, show only sets that contain this translation
                    setSets(setsContainingTranslation);
                } else {
                    // In add mode, fetch all user sets and filter by language
                    const result = await setService.getUserSets(1, 100);
                    const allSets = result.sets || [];
                    
                    // Filter sets compatible with this translation's language
                    const compatibleSets = allSets.filter(
                        set => set.languageId === translation.languageId
                    );
                    
                    // Filter out sets that already contain this translation
                    const setsWithoutTranslation = compatibleSets.filter(
                        set => !setsContainingTranslation.some(s => s.id === set.id)
                    );
                    
                    setSets(setsWithoutTranslation);
                }
            } catch (err) {
                setError('Failed to load your sets');
                console.error('Error fetching sets:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSets();
    }, [translation.languageId, isRemoveMode, setsContainingTranslation]);

    const handleAction = async () => {
        if (!selectedSetId) {
            setError('Please select a set');
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            if (isRemoveMode) {
                await setService.removeTranslationFromSet(selectedSetId, translation.id);
            } else {
                await setService.addTranslationToSet(selectedSetId, translation.id);
            }
            onClose(true); // Pass true to indicate refresh needed
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${isRemoveMode ? 'remove word from' : 'add word to'} set`);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <Card className={styles.modal} onClick={(e) => e.stopPropagation()} asDiv>
                <h2 className={styles.title}>{isRemoveMode ? 'Remove from Set' : 'Add to Set'}</h2>
                <p className={styles.subtitle}>
                    {isRemoveMode ? 'Remove' : 'Add'} "<strong>{translation.wordText}</strong>" {isRemoveMode ? 'from one of your vocabulary sets' : 'to one of your vocabulary sets'}
                </p>

                {error && (
                    <div className={styles.error}>
                        <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Loading sets...</p>
                    </div>
                ) : sets.length === 0 ? (
                    <div className={styles.empty}>
                        <svg className={styles.emptyIcon} viewBox="0 0 20 20" fill="currentColor">
                            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                        </svg>
                        <p>
                            {isRemoveMode 
                                ? `"${translation.wordText}" is not in any of your sets.`
                                : `You don't have any ${translation.language?.name || 'compatible'} sets available to add this word to.`
                            }
                        </p>
                        {!isRemoveMode && (
                            <p className={styles.hint}>Create a set first or this word may already be in all your sets.</p>
                        )}
                    </div>
                ) : (
                    <div className={styles.setList}>
                        {sets.map((set) => (
                            <label 
                                key={set.id} 
                                className={`${styles.setOption} ${selectedSetId === set.id ? styles.selected : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="set"
                                    value={set.id}
                                    checked={selectedSetId === set.id}
                                    onChange={(e) => setSelectedSetId(e.target.value)}
                                    className={styles.radio}
                                />
                                <div className={styles.setInfo}>
                                    <span className={styles.setName}>{set.name}</span>
                                    <span className={styles.setMeta}>
                                        <svg className={styles.metaIcon} viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                                        </svg>
                                        {set._count?.setWords || 0} words
                                    </span>
                                </div>
                            </label>
                        ))}
                    </div>
                )}

                <div className={styles.actions}>
                    <Button
                        variant="primary"
                        onClick={handleAction}
                        disabled={!selectedSetId || processing || sets.length === 0}
                        fullWidth
                    >
                        {processing ? (
                            <>
                                <div className={styles.buttonSpinner}></div>
                                {isRemoveMode ? 'Removing...' : 'Adding...'}
                            </>
                        ) : (
                            isRemoveMode ? 'Remove from Set' : 'Add to Set'
                        )}
                    </Button>
                    <Button variant="secondary" onClick={onClose} fullWidth>
                        Cancel
                    </Button>
                </div>
            </Card>
        </div>
    );
}