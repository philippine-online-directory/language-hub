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
                    const data = await setService.getSetWords(setId);
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
                await setService.publishSet(setId, formData);
            } 
            else {
                const newSet = await setService.createSet(formData);
                navigate(`/sets/${newSet.id}`);
                return;
            }
            navigate(`/sets/${setId}`);
        } 
        catch (err) {
            setErrors({
                submit: err.response?.data?.message || 'Failed to save set. Please try again.',
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
                <div className={styles.loading}>Loading set...</div>
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
                    {errors.submit && <div className={styles.error}>{errors.submit}</div>}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <Input
                            label="Set Name"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            error={errors.name}
                            required
                            placeholder="e.g., Essential Phrases"
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
                                className={styles.textarea}
                                rows="4"
                                required
                                placeholder="Describe what this set contains"
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
                                className={styles.select}
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
                                    Language cannot be changed after creation
                                </span>
                            )}
                        </div>

                        {isEditing && (
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
                                        <span className={styles.checkboxLabelText}>Make this set public</span>
                                        <span className={styles.checkboxHelper}>
                                            Public sets can be discovered and used by other users
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className={styles.actions}>
                            <Button type="submit" fullWidth disabled={loading}>
                                {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Set'}
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