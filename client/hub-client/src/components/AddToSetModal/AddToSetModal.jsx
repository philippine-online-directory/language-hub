import { useState, useEffect } from 'react';
import { setService } from '../api/setService';
import Button from './Button/Button';
import Card from './Card/Card';
import styles from './AddToSetModal.module.css';

export default function AddToSetModal({ translation, onClose }){
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSetId, setSelectedSetId] = useState('');
    const [error, setError] = useState(null);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        const fetchSets = async () => {
            try {
                const data = await setService.getUserSets();
                const compatibleSets = data.filter(
                    set => set.languageId === translation.languageId
                );
                setSets(compatibleSets);
            } catch (err) {
                setError('Failed to load your sets');
                console.error('Error fetching sets:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSets();
    }, [translation.languageId]);

    const handleAdd = async () => {
        if (!selectedSetId) {
            setError('Please select a set');
            return;
        }

        setAdding(true);
        setError(null);

        try {
            await setService.addTranslationToSet(selectedSetId, translation.id);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add word to set');
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <Card className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.title}>Add to Set</h2>
                <p className={styles.subtitle}>
                    Add "{translation.wordText}" to one of your vocabulary sets
                </p>

                {error && <div className={styles.error}>{error}</div>}

                {loading ? (
                    <div className={styles.loading}>Loading sets...</div>
                ) : sets.length === 0 ? (
                    <div className={styles.empty}>
                        <p>You don't have any sets for this language yet.</p>
                        <p className={styles.hint}>Create a set first to add words to it.</p>
                    </div>
                ) : (
                    <div className={styles.setList}>
                        {sets.map((set) => (
                            <label key={set.id} className={styles.setOption}>
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
                        onClick={handleAdd}
                        disabled={!selectedSetId || adding || sets.length === 0}
                        fullWidth
                    >
                        {adding ? 'Adding...' : 'Add to Set'}
                    </Button>
                    <Button variant="secondary" onClick={onClose} fullWidth>
                        Cancel
                    </Button>
                </div>
            </Card>
        </div>
    );
}