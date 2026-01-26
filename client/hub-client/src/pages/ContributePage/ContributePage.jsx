import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contributionService } from '../../api/contributionService';
import { languageService } from '../../api/languageService';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import styles from './ContributePage.module.css';

export default function ContributePage(){
    const navigate = useNavigate();
    const [languages, setLanguages] = useState([]);
    const [formData, setFormData] = useState({
        languageId: '',
        wordText: '',
        ipa: '',
        englishDefinition: '',
        exampleSentence: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [languagesLoading, setLanguagesLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchLanguages = async () => {
            setLanguagesLoading(true);
            try {
                // Fetch first page with many languages
                const result = await languageService.getLanguages(1, 100);
                setLanguages(result.languages || []);
            } 
            catch (err) {
                console.error('Error fetching languages:', err);
                setErrors({ submit: 'Failed to load languages. Please refresh the page.' });
            }
            finally {
                setLanguagesLoading(false);
            }
        };

        fetchLanguages();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    const validate = () => {
        const newErrors = {};
        
        if (!formData.languageId) newErrors.languageId = 'Please select a language';
        if (!formData.wordText) newErrors.wordText = 'Word is required';
        if (!formData.englishDefinition) newErrors.englishDefinition = 'Definition is required';
        if (!formData.exampleSentence) newErrors.exampleSentence = 'Example sentence is required';
        
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
        setSuccess(false);
        
        try {
            await contributionService.contributeTranslation(formData);
            setSuccess(true);
            setFormData({
                languageId: formData.languageId,
                wordText: '',
                ipa: '',
                englishDefinition: '',
                exampleSentence: '',
            });
            setTimeout(() => setSuccess(false), 5000);
        } 
        catch (err) {
            setErrors({
                submit: err.response?.data?.message || 'Failed to submit contribution. Please try again.',
            });
        } 
        finally {
            setLoading(false);
        }
    };

    return (
        <div className={`${styles.contributePage} ${mounted ? styles.mounted : ''}`}>
            <div className={styles.backgroundPattern}></div>
            
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Contribute a Word</h1>
                    <p className={styles.subtitle}>
                        Help preserve languages by sharing words and phrases you know
                    </p>
                </header>

                <Card className={styles.formCard}>
                    {success && (
                        <div className={styles.success}>
                            This word has been preserved. Thank you for your contribution!
                        </div>
                    )}

                    {errors.submit && <div className={styles.error}>{errors.submit}</div>}

                    <form noValidate onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label htmlFor="languageId" className={styles.label}>
                                Language <span className={styles.required}>*</span>
                            </label>
                            {languagesLoading ? (
                                <div className={styles.loadingSelect}>Loading languages...</div>
                            ) : (
                                <select
                                    id="languageId"
                                    name="languageId"
                                    value={formData.languageId}
                                    onChange={handleChange}
                                    className={styles.select}
                                    required
                                >
                                    <option value="">Select a language</option>
                                    {languages.map((lang) => (
                                        <option key={lang.id} value={lang.id}>
                                            {lang.name} ({lang.isoCode.toUpperCase()})
                                        </option>
                                    ))}
                                </select>
                            )}
                            {errors.languageId && (
                                <span className={styles.errorText}>{errors.languageId}</span>
                            )}
                        </div>

                        <Input
                            label="Word or Phrase"
                            type="text"
                            name="wordText"
                            value={formData.wordText}
                            onChange={handleChange}
                            error={errors.wordText}
                            required
                            placeholder="Enter the word in the original language"
                        />

                        <Input
                            label="Pronunciation (IPA)"
                            type="text"
                            name="ipa"
                            value={formData.ipa}
                            onChange={handleChange}
                            placeholder="Optional: International Phonetic Alphabet notation"
                        />

                        <div className={styles.formGroup}>
                            <label htmlFor="englishDefinition" className={styles.label}>
                                English Definition <span className={styles.required}>*</span>
                            </label>
                            <textarea
                                id="englishDefinition"
                                name="englishDefinition"
                                value={formData.englishDefinition}
                                onChange={handleChange}
                                className={styles.textarea}
                                rows="3"
                                required
                                placeholder="Provide the English definition"
                            />
                            {errors.englishDefinition && (
                                <span className={styles.errorText}>{errors.englishDefinition}</span>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="exampleSentence" className={styles.label}>
                                Example Sentence <span className={styles.required}>*</span>
                            </label>
                            <textarea
                                id="exampleSentence"
                                name="exampleSentence"
                                value={formData.exampleSentence}
                                onChange={handleChange}
                                className={styles.textarea}
                                rows="3"
                                required
                                placeholder="Show how this word is used in context"
                            />
                            {errors.exampleSentence && (
                                <span className={styles.errorText}>{errors.exampleSentence}</span>
                            )}
                        </div>

                        <div className={styles.actions}>
                            <Button type="submit" fullWidth disabled={loading || languagesLoading}>
                                {loading ? 'Submitting...' : 'Submit Contribution'}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                fullWidth
                                onClick={() => navigate('/contributions')}
                            >
                                View My Contributions
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}