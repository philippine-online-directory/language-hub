import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { setService } from '../../api/setService';
import { languageService } from '../../api/languageService';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import styles from './CreateEditSetPage.module.css';

export default function CreateEditSetPage(){
    const navigate = useNavigate();
    const { setId } = useParams();
    const isEditing = !!setId;
    const [languages, setLanguages] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        languageId: '',
        isPublic: false,
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingSet, setLoadingSet] = useState(isEditing);

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const data = await languageService.getLanguages();
                setLanguages(data);
            } 
            catch (err) {
                console.error('Error fetching languages:', err);
            }
        };
        fetchLanguages();
    }, []);

    useEffect(() => {
        if (isEditing) {
            const fetchSet = async () => {
                try {
                    const data = await setService.getSetById(setId);
                    setFormData({
                        name: data.name,
                        description: data.description,
                        languageId: data.languageId,
                        isPublic: data.isPublic || false,
                    });
                } 
                catch (err) {
                    console.error('Error fetching set:', err);
                    alert('Failed to load set');
                    navigate('/sets');
                } 
                finally {
                    setLoadingSet(false);
                }
            };
            fetchSet();
        }
    }, [isEditing, setId, navigate]);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value,
        });

        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    const validate = () => {
        const newErrors = {};
        
        if (!formData.name) {
            newErrors.name = 'Set name is required';
        } 
        else if (formData.name.length < 3) {
            newErrors.name = 'Set name must be at least 3 characters';
        }
        
        if (!formData.description) {
            newErrors.description = 'Description is required';
        }
        
        if (!formData.languageId) {
            newErrors.languageId = 'Please select a language';
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

        setLoading(true);
        
        try {
            if (isEditing) {
                await setService.updateSet(setId, formData);
                navigate(`/sets/${setId}`);
            } 
            else {
                const newSet = await setService.createSet(formData);
                navigate(`/sets/${newSet.id}`);
            }
        } 
        catch (err) {
            setErrors({
                submit: err.response?.data?.message || err.message || 'Failed to save set. Please try again.',
            });
        } 
        finally {
            setLoading(false);
        }
    };

    if (loadingSet) {
        return (
            <div className={styles.createEditSetPage}>
                <div className={styles.container}>
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Loading set...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.createEditSetPage}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>
                        {isEditing ? 'Edit Set' : 'Create New Set'}
                    </h1>
                    <p className={styles.subtitle}>
                        Build a vocabulary collection for language learning
                    </p>
                </header>

                <Card className={styles.formCard}>
                    {errors.submit && (
                        <div className={styles.errorBanner}>
                            <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {errors.submit}
                        </div>
                    )}

                    <form noValidate onSubmit={handleSubmit} className={styles.form}>
                        <Input
                            label="Set Name"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            error={errors.name}
                            required
                            placeholder="e.g., Essential Tagalog Phrases"
                        />

                        <div className={styles.formGroup}>
                            <label htmlFor="description" className={styles.label}>
                                Description <span className={styles.required}>*</span>
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
                                rows="4"
                                required
                                placeholder="Describe what this set contains and who it's for..."
                            />
                            {errors.description && (
                                <span className={styles.errorText}>{errors.description}</span>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="languageId" className={styles.label}>
                                Language <span className={styles.required}>*</span>
                            </label>
                            <select
                                id="languageId"
                                name="languageId"
                                value={formData.languageId}
                                onChange={handleChange}
                                className={`${styles.select} ${errors.languageId ? styles.inputError : ''}`}
                                required
                                disabled={isEditing}
                            >
                                <option value="">Select a language</option>
                                {languages.map((lang) => (
                                    <option key={lang.id} value={lang.id}>
                                        {lang.name} ({lang.isoCode.toUpperCase()})
                                    </option>
                                ))}
                            </select>
                            {errors.languageId && (
                                <span className={styles.errorText}>{errors.languageId}</span>
                            )}
                            {isEditing && (
                                <span className={styles.helperText}>
                                    <svg className={styles.helperIcon} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    Language cannot be changed after creation
                                </span>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <div className={styles.checkboxWrapper}>
                                <input
                                    type="checkbox"
                                    id="isPublic"
                                    name="isPublic"
                                    checked={formData.isPublic}
                                    onChange={handleChange}
                                    className={styles.checkbox}
                                />
                                <label htmlFor="isPublic" className={styles.checkboxLabel}>
                                    <span className={styles.checkboxLabelText}>
                                        <svg className={styles.checkboxIcon} viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                                        </svg>
                                        Make this set public
                                    </span>
                                    <span className={styles.checkboxHelper}>
                                        Public sets can be discovered and used by other users
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <Button type="submit" variant="primary" fullWidth disabled={loading}>
                                {loading ? (
                                    <>
                                        <div className={styles.buttonSpinner}></div>
                                        Saving...
                                    </>
                                ) : (
                                    isEditing ? 'Save Changes' : 'Create Set'
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                fullWidth
                                onClick={() => navigate(isEditing ? `/sets/${setId}` : '/sets')}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}