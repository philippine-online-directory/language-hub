import { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { languageService } from '../../api/languageService';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import Input from '../../components/Input/Input';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal/ConfirmDeleteModal';
import styles from './AdminLanguagesPage.module.css';

export default function AdminLanguagesPage(){
    const { user } = useAuth();
    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [pendingDeleteLanguage, setPendingDeleteLanguage] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        isoCode: '',
        speakerCount: '',
        preservationNote: '',
        culturalBackground: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        fetchLanguages();
    }, []);

    const fetchLanguages = async () => {
        setLoading(true);
        try {
            // Fetch all languages for admin (large limit)
            const result = await languageService.getLanguages(1, 1000);
            setLanguages(result.languages || []);
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
            isoCode: language.isoCode ?? '',
            speakerCount: language.speakerCount?.toString() || '',
            preservationNote: language.preservationNote || '',
            culturalBackground: language.culturalBackground || ''
        });
        setShowForm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!pendingDeleteLanguage) return;
        try {
            await languageService.deleteLanguage(pendingDeleteLanguage.id);
            setPendingDeleteLanguage(null);
            await fetchLanguages();
        } catch (err) {
            alert('Failed to delete language');
            console.error('Error deleting language:', err);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });

        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    const validate = () => {
        const newErrors = {};
        const speakerCount = Number(formData.speakerCount);

        if (!formData.name.trim()) {
            newErrors.name = 'Language name is required';
        }

        if (formData.speakerCount && (!Number.isInteger(speakerCount) || speakerCount < 0)) {
            newErrors.speakerCount = 'Speaker count must be a positive whole number';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        const submitData = {
            ...formData,
            name: formData.name.trim(),
            isoCode: formData.isoCode.trim(),
            speakerCount: formData.speakerCount ? parseInt(formData.speakerCount) : null,
        };

        setSaving(true);
        setErrors({});

        try {
            if (editingId) {
                await languageService.updateLanguage(editingId, submitData);
            } else {
                await languageService.addLanguage(submitData);
            }
            
            setShowForm(false);
            setEditingId(null);
            setFormData({ name: '', isoCode: '', speakerCount: '', preservationNote: '', culturalBackground: '' });
            await fetchLanguages();
        } catch (err) {
            setErrors({ submit: err.response?.data?.message || 'Failed to save language' });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', isoCode: '', speakerCount: '', preservationNote: '', culturalBackground: '' });
        setErrors({});
    };

    if (user?.role !== 'ADMIN') {
        return (
            <div className={`${styles.adminLanguagesPage} ${mounted ? styles.mounted : ''}`}>
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
        <div className={`${styles.adminLanguagesPage} ${mounted ? styles.mounted : ''}`}>
            {pendingDeleteLanguage && (
                <ConfirmDeleteModal
                    itemType="Language"
                    itemName={pendingDeleteLanguage.name}
                    warning="Deleting this will also delete all translations in the dictionary."
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setPendingDeleteLanguage(null)}
                />
            )}
            <div className={styles.backgroundPattern}></div>
            
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

                        <form noValidate onSubmit={handleSubmit} className={styles.form}>
                            <Input
                                label="Language Name"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                error={errors.name}
                                required
                                placeholder="e.g., Ibanag"
                            />

                            <Input
                                label="ISO Code (optional)"
                                type="text"
                                name="isoCode"
                                value={formData.isoCode}
                                onChange={handleChange}
                                placeholder="e.g., ibg"
                                disabled={!!editingId}
                            />

                            <Input
                                label="Speaker Count"
                                type="number"
                                name="speakerCount"
                                value={formData.speakerCount}
                                onChange={handleChange}
                                error={errors.speakerCount}
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
                            
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Cultural Background</label>
                                <textarea
                                    value={formData.culturalBackground}
                                    onChange={(e) => setFormData({ ...formData, culturalBackground: e.target.value })}
                                    className={styles.textarea}
                                    rows="3"
                                    placeholder="Optional information about the origins and culture of the language"
                                />
                            </div>

                            <div className={styles.actions}>
                                <Button type="submit" variant="primary" loading={saving}>
                                    {editingId ? 'Save Changes' : 'Add Language'}
                                </Button>
                                <Button type="button" variant="secondary" onClick={handleCancel} disabled={saving}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Loading languages...</p>
                    </div>
                ) : (
                    <div className={styles.languagesList}>
                        {languages.map((language) => (
                            <Card key={language.id} className={styles.languageCard}>
                                <div className={styles.languageInfo}>
                                    <h3 className={styles.languageName}>{language.name}</h3>
                                    {language.isoCode && <p className={styles.isoCode}>{language.isoCode.toUpperCase()}</p>}
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
                                    <Button variant="secondary" onClick={() => setPendingDeleteLanguage({ id: language.id, name: language.name })}>
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
