import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { languageService } from '../api/languageService';
import Button from '../components/Button/Button';
import Card from '../components/Card/Card';
import Input from '../components/Input/Input';
import styles from './AdminLanguagesPage.module.css';

export default function AdminLanguagesPage(){
    const { user } = useAuth();
    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        isoCode: '',
        speakerCount: '',
        preservationNote: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchLanguages();
    }, []);

    const fetchLanguages = async () => {
        try {
            const data = await languageService.getLanguages();
            setLanguages(data);
        } catch (err) {
            console.error('Error fetching languages:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (language) => {
        setEditingId(language.id);
        setFormData({
            name: language.name,
            isoCode: language.isoCode,
            speakerCount: language.speakerCount?.toString() || '',
            preservationNote: language.preservationNote || '',
        });
        setShowForm(true);
    };

    const handleDelete = async (languageId) => {
        if (!window.confirm('Are you sure? This will delete all associated translations.')) {
            return;
        }

        try {
            await languageService.deleteLanguage(languageId);
            await fetchLanguages();
        } catch (err) {
            alert('Failed to delete language');
            console.error('Error deleting language:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        const submitData = {
            ...formData,
            speakerCount: formData.speakerCount ? parseInt(formData.speakerCount) : null,
        };

        try {
            if (editingId) {
                await languageService.updateLanguage(editingId, submitData);
            } else {
                await languageService.addLanguage(submitData);
            }
            
            setShowForm(false);
            setEditingId(null);
            setFormData({ name: '', isoCode: '', speakerCount: '', preservationNote: '' });
            await fetchLanguages();
        } catch (err) {
            setErrors({ submit: err.response?.data?.message || 'Failed to save language' });
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', isoCode: '', speakerCount: '', preservationNote: '' });
        setErrors({});
    };

    if (user?.role !== 'ADMIN') {
        return (
            <div className={styles.adminLanguagesPage}>
                <div className={styles.container}>
                    <div className={styles.unauthorized}>Unauthorized access</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.adminLanguagesPage}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Manage Languages</h1>
                    {!showForm && (
                        <Button variant="primary" onClick={() => setShowForm(true)}>
                            Add New Language
                        </Button>
                    )}
                </header>

                {showForm && (
                    <Card className={styles.formCard}>
                        <h2 className={styles.formTitle}>
                            {editingId ? 'Edit Language' : 'Add New Language'}
                        </h2>
                        
                        {errors.submit && <div className={styles.error}>{errors.submit}</div>}

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <Input
                                label="Language Name"
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="e.g., Navajo"
                            />

                            <Input
                                label="ISO Code"
                                type="text"
                                value={formData.isoCode}
                                onChange={(e) => setFormData({ ...formData, isoCode: e.target.value })}
                                required
                                placeholder="e.g., nav"
                                disabled={!!editingId}
                            />

                            <Input
                                label="Speaker Count"
                                type="number"
                                value={formData.speakerCount}
                                onChange={(e) => setFormData({ ...formData, speakerCount: e.target.value })}
                                placeholder="Optional"
                            />

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Preservation Note</label>
                                <textarea
                                    value={formData.preservationNote}
                                    onChange={(e) => setFormData({ ...formData, preservationNote: e.target.value })}
                                    className={styles.textarea}
                                    rows="3"
                                    placeholder="Optional context about preservation efforts"
                                />
                            </div>

                            <div className={styles.actions}>
                                <Button type="submit" variant="primary">
                                    {editingId ? 'Save Changes' : 'Add Language'}
                                </Button>
                                <Button type="button" variant="secondary" onClick={handleCancel}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {loading ? (
                    <div className={styles.loading}>Loading languages...</div>
                ) : (
                    <div className={styles.languagesList}>
                        {languages.map((language) => (
                            <Card key={language.id} className={styles.languageCard}>
                                <div className={styles.languageInfo}>
                                    <h3 className={styles.languageName}>{language.name}</h3>
                                    <p className={styles.isoCode}>{language.isoCode.toUpperCase()}</p>
                                    {language.speakerCount && (
                                        <p className={styles.speakerCount}>
                                            {language.speakerCount.toLocaleString()} speakers
                                        </p>
                                    )}
                                    {language.preservationNote && (
                                        <p className={styles.note}>{language.preservationNote}</p>
                                    )}
                                </div>
                                <div className={styles.cardActions}>
                                    <Button variant="secondary" onClick={() => handleEdit(language)}>
                                        Edit
                                    </Button>
                                    <Button variant="secondary" onClick={() => handleDelete(language.id)}>
                                        Delete
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}