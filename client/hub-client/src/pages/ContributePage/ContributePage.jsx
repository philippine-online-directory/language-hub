import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { contributionService } from '../../api/contributionService';
import { languageService } from '../../api/languageService';
import IntellectualPropertyModal from '../../components/IntellectualPropertyModal/IntellectualPropertyModal';
import MissingWordsSidebar from '../../components/MissingWordsSidebar/MissingWordsSidebar';
import MissingWordsBottomSheet from '../../components/MissingWordsSidebar/MissingWordsBottomSheet';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import styles from './ContributePage.module.css';

const STEPS = [
    { id: 1, label: 'Language & Word', requiredFields: ['languageId', 'wordText'] },
    { id: 2, label: 'Meaning', requiredFields: ['englishDefinition'] },
    { id: 3, label: 'Context & Audio', requiredFields: [] },
    { id: 4, label: 'Review', requiredFields: [] },
];

const POS_OPTIONS = [
    { value: 'noun',         label: 'Noun',         definition: 'Names a person, place, thing, or idea.' },
    { value: 'verb',         label: 'Verb',         definition: 'Expresses an action, occurrence, or state.' },
    { value: 'adjective',    label: 'Adjective',    definition: 'Describes or modifies a noun or pronoun.' },
    { value: 'adverb',       label: 'Adverb',       definition: 'Modifies a verb, adjective, or other adverb.' },
    { value: 'pronoun',      label: 'Pronoun',      definition: 'Stands in place of a noun (e.g., siya, ito).' },
    { value: 'preposition',  label: 'Preposition',  definition: 'Shows relationship between a noun and other words.' },
    { value: 'conjunction',  label: 'Conjunction',  definition: 'Connects words, phrases, or clauses.' },
    { value: 'interjection', label: 'Interjection', definition: 'Expresses a sudden emotion or reaction.' },
    { value: 'particle',     label: 'Particle',     definition: 'A function word with grammatical role (common in Philippine languages).' },
    { value: 'phrase',       label: 'Phrase',       definition: 'A group of words functioning as a single unit.' },
    { value: 'other',        label: 'Other',        definition: 'Does not fit the categories above.' },
];

const MAX_RECORDING_SECONDS = 10;

function PosChip({ option, selected, onSelect }) {
    const [showTip, setShowTip] = useState(false);
    const tipRef = useRef(null);

    return (
        <div className={styles.posChipWrapper}>
            <button
                type="button"
                className={`${styles.posChip} ${selected ? styles.posChipSelected : ''}`}
                onClick={() => onSelect(selected ? '' : option.value)}
                onMouseEnter={() => setShowTip(true)}
                onMouseLeave={() => setShowTip(false)}
                onFocus={() => setShowTip(true)}
                onBlur={() => setShowTip(false)}
                aria-pressed={selected}
            >
                {option.label}
            </button>
            {showTip && (
                <div className={styles.posTooltip} role="tooltip" ref={tipRef}>
                    {option.definition}
                </div>
            )}
        </div>
    );
}

function StepSidebar({ currentStep, visitedSteps, formData }) {
    const isStepFilled = (step) => {
        if (!visitedSteps.has(step.id)) return false;
        return step.requiredFields.every(f => !!formData[f]);
    };

    return (
        <aside className={styles.sidebar}>
            <ol className={styles.sidebarList}>
                {STEPS.map((step) => {
                    const isCurrent = currentStep === step.id;
                    const isVisited = visitedSteps.has(step.id) && !isCurrent;
                    const filled = isStepFilled(step);

                    let state = 'upcoming';
                    if (isCurrent) state = 'current';
                    else if (isVisited && filled) state = 'done';
                    else if (isVisited && !filled && step.requiredFields.length > 0) state = 'skipped';
                    else if (isVisited) state = 'done';

                    return (
                        <li key={step.id} className={`${styles.sidebarStep} ${styles[`sidebarStep--${state}`]}`}>
                            <span className={styles.sidebarStepIcon} aria-hidden="true">
                                {state === 'done' && (
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="2 7 5.5 10.5 12 4" />
                                    </svg>
                                )}
                                {state === 'skipped' && (
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="7" y1="3" x2="7" y2="8" />
                                        <circle cx="7" cy="11" r="0.5" fill="currentColor" />
                                    </svg>
                                )}
                                {state === 'current' && <span className={styles.sidebarDot} />}
                                {state === 'upcoming' && <span className={styles.sidebarEmpty} />}
                            </span>
                            <span className={styles.sidebarStepLabel}>{step.label}</span>
                        </li>
                    );
                })}
            </ol>
        </aside>
    );
}

export default function ContributePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [currentStep, setCurrentStep] = useState(1);
    const [direction, setDirection] = useState('forward');
    const [visitedSteps, setVisitedSteps] = useState(new Set([1]));

    const [languages, setLanguages] = useState([]);
    const [formData, setFormData] = useState({
        languageId: '',
        wordText: '',
        englishDefinition: '',
        exampleSentence: '',
        partOfSpeech: '',
        usageComment: '',
    });
    const [audioFile, setAudioFile] = useState(null);
    const [audioMode, setAudioMode] = useState('upload');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioContext, setAudioContext] = useState(null);
    const [analyser, setAnalyser] = useState(null);
    const [waveformData, setWaveformData] = useState(new Uint8Array(128));
    const [uploadProgress, setUploadProgress] = useState(0);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [languagesLoading, setLanguagesLoading] = useState(true);
    const [uploadingAudio, setUploadingAudio] = useState(false);
    const [success, setSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [ipAgreed, setIpAgreed] = useState(false);
    const [showIPModal, setShowIPModal] = useState(false);
    const [prefillWord, setPrefillWord] = useState('');
    const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

    const selectedSlug = languages.find(l => l.id === formData.languageId)?.slug ?? null;

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= MAX_RECORDING_SECONDS) {
                        stopRecording();
                        return MAX_RECORDING_SECONDS;
                    }
                    return prev + 1;
                });
            }, 1000);
        } else {
            setRecordingTime(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    useEffect(() => {
        let animationId;
        if (isRecording && analyser) {
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateWaveform = () => {
                analyser.getByteTimeDomainData(dataArray);
                setWaveformData(new Uint8Array(dataArray));
                animationId = requestAnimationFrame(updateWaveform);
            };
            updateWaveform();
        }
        return () => { if (animationId) cancelAnimationFrame(animationId); };
    }, [isRecording, analyser]);

    useEffect(() => {
        return () => {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
            if (audioContext && audioContext.state !== 'closed') audioContext.close();
        };
    }, [mediaRecorder, audioContext]);

    useEffect(() => {
        const fetchLanguages = async () => {
            setLanguagesLoading(true);
            try {
                const result = await languageService.getLanguages(1, 100);
                const langs = result.languages || [];
                setLanguages(langs);

                const languageSlug = searchParams.get('languageSlug');
                const englishWord = searchParams.get('englishWord');

                if (languageSlug || englishWord) {
                    setPrefillWord(englishWord || '');
                    setFormData(prev => ({
                        ...prev,
                        languageId: languageSlug
                            ? (langs.find(l => l.slug === languageSlug)?.id ?? prev.languageId)
                            : prev.languageId,
                        englishDefinition: englishWord || prev.englishDefinition,
                    }));
                }
            } catch (err) {
                console.error('Error fetching languages:', err);
                setErrors({ submit: 'Failed to load languages. Please refresh the page.' });
            } finally {
                setLanguagesLoading(false);
            }
        };
        fetchLanguages();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
    };

    const handleAudioChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a'];
        if (!validTypes.includes(file.type)) {
            setErrors({ ...errors, audio: 'Please select a valid audio file (MP3, WAV, OGG, WebM, or M4A)' });
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setErrors({ ...errors, audio: 'Audio file must be less than 10MB' });
            return;
        }
        setAudioFile(file);
        setAudioBlob(null);
        if (errors.audio) setErrors({ ...errors, audio: '' });
    };

    const handleAudioModeChange = (mode) => {
        setAudioMode(mode);
        setAudioFile(null);
        setAudioBlob(null);
        setRecordingTime(0);
        if (errors.audio) setErrors({ ...errors, audio: '' });
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyserNode = audioCtx.createAnalyser();
            analyserNode.fftSize = 256;
            source.connect(analyserNode);
            setAudioContext(audioCtx);
            setAnalyser(analyserNode);

            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            const chunks = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                if (blob.size > 10 * 1024 * 1024) {
                    setErrors({ ...errors, audio: 'Recording is too large (max 10MB).' });
                    setAudioBlob(null);
                } else {
                    setAudioBlob(blob);
                    setAudioFile(null);
                    if (errors.audio) setErrors({ ...errors, audio: '' });
                }
                stream.getTracks().forEach(t => t.stop());
                if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
            };
            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            setErrors({ ...errors, audio: 'Could not access microphone. Please check permissions.' });
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    const deleteRecording = () => {
        setAudioBlob(null);
        setRecordingTime(0);
        if (errors.audio) setErrors({ ...errors, audio: '' });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const validateStep = (step) => {
        const newErrors = {};
        if (step === 1) {
            if (!formData.languageId) newErrors.languageId = 'Please select a language';
            if (!formData.wordText) newErrors.wordText = 'Word is required';
        }
        if (step === 2) {
            if (!formData.englishDefinition) newErrors.englishDefinition = 'Definition is required';
        }
        if (step === 4) {
            if (!ipAgreed) newErrors.ipAgreed = 'You must confirm your intellectual property rights before submitting';
        }
        return newErrors;
    };

    const validateAll = () => {
        const newErrors = {};
        if (!formData.languageId) newErrors.languageId = 'Please select a language';
        if (!formData.wordText) newErrors.wordText = 'Word is required';
        if (!formData.englishDefinition) newErrors.englishDefinition = 'Definition is required';
        if (!ipAgreed) newErrors.ipAgreed = 'You must confirm your intellectual property rights before submitting';
        return newErrors;
    };

    const stepForError = (errorKey) => {
        if (['languageId', 'wordText'].includes(errorKey)) return 1;
        if (['englishDefinition'].includes(errorKey)) return 2;
        if (['audio'].includes(errorKey)) return 3;
        return 4;
    };

    const goToStep = (next) => {
        setDirection(next > currentStep ? 'forward' : 'back');
        setCurrentStep(next);
        setVisitedSteps(prev => new Set([...prev, next]));
    };

    const handleNext = () => {
        const stepErrors = validateStep(currentStep);
        if (Object.keys(stepErrors).length > 0) {
            setErrors(stepErrors);
            return;
        }
        setErrors({});
        goToStep(currentStep + 1);
    };

    const handleBack = () => {
        setErrors({});
        goToStep(currentStep - 1);
    };

    const handleMissingWordClick = useCallback((word) => {
        if (loading) return;
        setFormData(prev => ({ ...prev, englishDefinition: word.word, wordText: '' }));
        setPrefillWord(word.word);
        setErrors({});
        setDirection('back');
        setCurrentStep(1);
        setVisitedSteps(new Set([1]));
        setMobileSheetOpen(false);
    }, [loading]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateAll();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            const firstErrorKey = Object.keys(validationErrors)[0];
            goToStep(stepForError(firstErrorKey));
            return;
        }

        setLoading(true);
        setSuccess(false);
        setUploadProgress(0);

        try {
            let audioS3Key = null;
            const audioToUpload = audioFile || (audioBlob ? new File([audioBlob], 'recording.webm', { type: 'audio/webm' }) : null);

            if (audioToUpload) {
                setUploadingAudio(true);
                setUploadProgress(10);
                try {
                    const progressInterval = setInterval(() => {
                        setUploadProgress(prev => (prev >= 90 ? prev : prev + 10));
                    }, 200);
                    audioS3Key = await contributionService.uploadAudio(audioToUpload);
                    clearInterval(progressInterval);
                    setUploadProgress(100);
                } catch {
                    setErrors({ submit: 'Failed to upload audio file. Please try again.' });
                    setLoading(false);
                    setUploadingAudio(false);
                    setUploadProgress(0);
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, 300));
                setUploadingAudio(false);
            }

            await contributionService.contributeTranslation({
                ...formData,
                audioUrl: audioS3Key,
            });

            setSuccess(true);
            setFormData({
                languageId: formData.languageId,
                wordText: '',
                englishDefinition: '',
                exampleSentence: '',
                partOfSpeech: '',
                usageComment: '',
            });
            setAudioFile(null);
            setAudioBlob(null);
            setRecordingTime(0);
            setUploadProgress(0);
            setCurrentStep(1);
            setVisitedSteps(new Set([1]));

            const fileInput = document.getElementById('audioFile');
            if (fileInput) fileInput.value = '';

            setTimeout(() => setSuccess(false), 5000);
        } catch (err) {
            setErrors({
                submit: err.response?.data?.message || err.message || 'Failed to submit contribution. Please try again.',
            });
        } finally {
            setLoading(false);
            setUploadingAudio(false);
            setUploadProgress(0);
            setIpAgreed(false);
        }
    };

    const animKey = `step-${currentStep}-${direction}`;

    return (
        <div className={`${styles.contributePage} ${mounted ? styles.mounted : ''}`}>
            <div className={styles.backgroundPattern} />

            <IntellectualPropertyModal isOpen={showIPModal} onClose={() => setShowIPModal(false)} />

            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Contribute a Word</h1>
                    <p className={styles.subtitle}>Help preserve languages by sharing words and phrases you know</p>
                </header>

                <div className={styles.layout}>
                    <div>
                        <StepSidebar
                            currentStep={currentStep}
                            visitedSteps={visitedSteps}
                            formData={formData}
                        />
                        {selectedSlug && (
                            <button
                                type="button"
                                className={styles.mobileSheetBtn}
                                onClick={() => setMobileSheetOpen(true)}
                            >
                                View Missing Words
                            </button>
                        )}
                    </div>

                    <div className={styles.cardWrapper}>
                        {prefillWord && (
                            <div className={styles.prefillBanner}>
                                Creating a contribution for &ldquo;{prefillWord}&rdquo;
                            </div>
                        )}

                        {success && (
                            <div className={styles.success}>
                                This word has been preserved. Thank you for your contribution!
                            </div>
                        )}

                        <Card className={styles.formCard}>
                            <div
                                key={animKey}
                                className={`${styles.stepContent} ${direction === 'forward' ? styles.slideInRight : styles.slideInLeft}`}
                            >
                                <div className={styles.stepHeader}>
                                    <span className={styles.stepCount}>Step {currentStep} of {STEPS.length}</span>
                                    <h2 className={styles.stepTitle}>{STEPS[currentStep - 1].label}</h2>
                                    {currentStep === 1 && (
                                        <p className={styles.requiredNote}>Required fields are labeled with a <span className={styles.required}>*</span></p>
                                    )}
                                </div>

                                <form noValidate onSubmit={handleSubmit}>
                                    {errors.submit && <div className={styles.error}>{errors.submit}</div>}

                                    {/* Step 1: Language & Word */}
                                    {currentStep === 1 && (
                                        <div className={styles.stepFields}>
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
                                                                {lang.name}{lang.isoCode ? ` (${lang.isoCode.toUpperCase()})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                                {errors.languageId && <span className={styles.errorText}>{errors.languageId}</span>}
                                            </div>

                                            <Input
                                                label="Word or Phrase"
                                                type="text"
                                                name="wordText"
                                                value={formData.wordText}
                                                onChange={handleChange}
                                                error={errors.wordText}
                                                required
                                                placeholder="Enter the word in the native language"
                                            />
                                        </div>
                                    )}

                                    {/* Step 2: Meaning */}
                                    {currentStep === 2 && (
                                        <div className={styles.stepFields}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Part of Speech</label>
                                                <p className={styles.posHint}>Hover or focus a chip to see its definition.</p>
                                                <div className={styles.posGrid}>
                                                    {POS_OPTIONS.map(option => (
                                                        <PosChip
                                                            key={option.value}
                                                            option={option}
                                                            selected={formData.partOfSpeech === option.value}
                                                            onSelect={(val) => {
                                                                setFormData({ ...formData, partOfSpeech: val });
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

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
                                                {errors.englishDefinition && <span className={styles.errorText}>{errors.englishDefinition}</span>}
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 3: Context & Audio */}
                                    {currentStep === 3 && (
                                        <div className={styles.stepFields}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Audio Pronunciation</label>

                                                <div className={styles.audioModeSelector}>
                                                    <button
                                                        type="button"
                                                        className={`${styles.modeButton} ${audioMode === 'upload' ? styles.modeButtonActive : ''}`}
                                                        onClick={() => handleAudioModeChange('upload')}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                            <polyline points="17 8 12 3 7 8" />
                                                            <line x1="12" y1="3" x2="12" y2="15" />
                                                        </svg>
                                                        Upload File
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`${styles.modeButton} ${audioMode === 'record' ? styles.modeButtonActive : ''}`}
                                                        onClick={() => handleAudioModeChange('record')}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                                            <line x1="12" y1="19" x2="12" y2="23" />
                                                            <line x1="8" y1="23" x2="16" y2="23" />
                                                        </svg>
                                                        Record Audio
                                                    </button>
                                                </div>

                                                {audioMode === 'upload' && (
                                                    <div className={styles.uploadSection}>
                                                        <input
                                                            type="file"
                                                            id="audioFile"
                                                            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/m4a"
                                                            onChange={handleAudioChange}
                                                            className={styles.fileInput}
                                                        />
                                                        {audioFile && (
                                                            <div className={styles.fileInfo}>
                                                                <span>{audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setAudioFile(null);
                                                                        const fileInput = document.getElementById('audioFile');
                                                                        if (fileInput) fileInput.value = '';
                                                                    }}
                                                                    className={styles.deleteButton}
                                                                    aria-label="Remove file"
                                                                >
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                                                                        <line x1="18" y1="6" x2="6" y2="18" />
                                                                        <line x1="6" y1="6" x2="18" y2="18" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        )}
                                                        <p className={styles.hint}>Max 10 MB &middot; MP3, WAV, OGG, WebM, or M4A</p>
                                                    </div>
                                                )}

                                                {audioMode === 'record' && (
                                                    <div className={styles.recordSection}>
                                                        {!audioBlob ? (
                                                            <>
                                                                <div className={styles.recordControls}>
                                                                    {!isRecording ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={startRecording}
                                                                            className={styles.recordButton}
                                                                            disabled={loading}
                                                                        >
                                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                                                <circle cx="12" cy="12" r="8" />
                                                                            </svg>
                                                                            Start Recording
                                                                        </button>
                                                                    ) : (
                                                                        <>
                                                                            <div className={styles.recordingContainer}>
                                                                                <div className={styles.waveformContainer}>
                                                                                    <svg className={styles.waveform} viewBox="0 0 256 100" preserveAspectRatio="none">
                                                                                        <path
                                                                                            d={Array.from(waveformData).map((value, i) => {
                                                                                                const x = (i / waveformData.length) * 256;
                                                                                                const y = ((value - 128) / 128) * 40 + 50;
                                                                                                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                                                                                            }).join(' ')}
                                                                                            fill="none"
                                                                                            stroke="url(#waveGradient)"
                                                                                            strokeWidth="2"
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                        />
                                                                                        <defs>
                                                                                            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                                                                <stop offset="0%" stopColor="#DC2626" />
                                                                                                <stop offset="50%" stopColor="#EF4444" />
                                                                                                <stop offset="100%" stopColor="#F87171" />
                                                                                            </linearGradient>
                                                                                        </defs>
                                                                                    </svg>
                                                                                </div>
                                                                                <div className={styles.recordingInfo}>
                                                                                    <div className={styles.recordingIndicator}>
                                                                                        <span className={styles.recordingDot} />
                                                                                        Recording: {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_SECONDS)}
                                                                                    </div>
                                                                                    <div className={styles.recordingProgress}>
                                                                                        <div
                                                                                            className={styles.recordingProgressBar}
                                                                                            style={{ width: `${(recordingTime / MAX_RECORDING_SECONDS) * 100}%` }}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={stopRecording}
                                                                                className={styles.stopButton}
                                                                            >
                                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                                                    <rect x="4" y="4" width="16" height="16" rx="2" />
                                                                                </svg>
                                                                                Stop Recording
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <p className={styles.hint}>Max {MAX_RECORDING_SECONDS} seconds &middot; Click allow when prompted for microphone access</p>
                                                            </>
                                                        ) : (
                                                            <div className={styles.recordingPreview}>
                                                                <div className={styles.previewHeader}>
                                                                    <span className={styles.previewTitle}>Preview Your Recording</span>
                                                                    <span className={styles.previewDuration}>{formatTime(recordingTime)}</span>
                                                                </div>
                                                                <audio controls src={URL.createObjectURL(audioBlob)} className={styles.audioPreview}>
                                                                    Your browser does not support the audio element.
                                                                </audio>
                                                                <div className={styles.recordingActions}>
                                                                    <button type="button" onClick={deleteRecording} className={styles.reRecordButton}>
                                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                                            <polyline points="1 4 1 10 7 10" />
                                                                            <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
                                                                        </svg>
                                                                        Re-record
                                                                    </button>
                                                                    <span className={styles.recordingReady}>Ready to upload ({(audioBlob.size / 1024).toFixed(1)} KB)</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {errors.audio && <span className={styles.errorText}>{errors.audio}</span>}
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label htmlFor="exampleSentence" className={styles.label}>Example Sentence</label>
                                                <textarea
                                                    id="exampleSentence"
                                                    name="exampleSentence"
                                                    value={formData.exampleSentence}
                                                    onChange={handleChange}
                                                    className={styles.textarea}
                                                    rows="3"
                                                    placeholder="Optional: Give an example sentence in the language"
                                                />
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label htmlFor="usageComment" className={styles.label}>Usage Comment</label>
                                                <textarea
                                                    id="usageComment"
                                                    name="usageComment"
                                                    value={formData.usageComment}
                                                    onChange={handleChange}
                                                    className={styles.textarea}
                                                    rows="3"
                                                    placeholder="Optional: Give a short note on when/how to use this word"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 4: Review & Submit */}
                                    {currentStep === 4 && (
                                        <div className={styles.stepFields}>
                                            <dl className={styles.reviewList}>
                                                <ReviewRow label="Language" value={languages.find(l => l.id === formData.languageId)?.name} />
                                                <ReviewRow label="Word or Phrase" value={formData.wordText} />
                                                {formData.partOfSpeech && (
                                                    <ReviewRow
                                                        label="Part of Speech"
                                                        value={POS_OPTIONS.find(p => p.value === formData.partOfSpeech)?.label}
                                                    />
                                                )}
                                                <ReviewRow label="English Definition" value={formData.englishDefinition} />
                                                {(audioFile || audioBlob) && (
                                                    <ReviewRow label="Audio" value={audioFile ? audioFile.name : 'Recorded audio'} />
                                                )}
                                                {formData.exampleSentence && <ReviewRow label="Example Sentence" value={formData.exampleSentence} />}
                                                {formData.usageComment && <ReviewRow label="Usage Comment" value={formData.usageComment} />}
                                            </dl>

                                            <div className={`${styles.formGroup} ${styles.ipRightsGroup}`}>
                                                <div className={styles.checkboxWrapper}>
                                                    <input
                                                        type="checkbox"
                                                        id="ipAgreed"
                                                        checked={ipAgreed}
                                                        onChange={(e) => {
                                                            setIpAgreed(e.target.checked);
                                                            if (errors.ipAgreed) setErrors({ ...errors, ipAgreed: '' });
                                                        }}
                                                        className={styles.checkbox}
                                                    />
                                                    <label htmlFor="ipAgreed" className={styles.checkboxLabel}>
                                                        I confirm that I hold the{' '}
                                                        <Link className={styles.ipLink} onClick={() => setShowIPModal(true)}>
                                                            intellectual property rights
                                                        </Link>
                                                        {' '}to this contribution, or have the right to share it, and I grant this platform a license to use it for language preservation purposes.{' '}
                                                        <span className={styles.required}>*</span>
                                                    </label>
                                                </div>
                                                {errors.ipAgreed && <span className={styles.errorText}>{errors.ipAgreed}</span>}
                                            </div>
                                        </div>
                                    )}

                                    {/* Navigation */}
                                    <div className={styles.stepNav}>
                                        {currentStep > 1 && (
                                            <Button type="button" variant="secondary" onClick={handleBack}>
                                                Back
                                            </Button>
                                        )}
                                        {currentStep < STEPS.length ? (
                                            <Button type="button" onClick={handleNext} disabled={languagesLoading && currentStep === 1}>
                                                Next
                                            </Button>
                                        ) : (
                                            <Button type="submit" loading={loading || uploadingAudio} disabled={languagesLoading}>
                                                {uploadingAudio ? `Uploading Audio… ${uploadProgress}%` : 'Submit Contribution'}
                                            </Button>
                                        )}
                                    </div>

                                    {uploadingAudio && (
                                        <div className={styles.uploadProgressBar}>
                                            <div className={styles.uploadProgressFill} style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                    )}
                                </form>
                            </div>
                        </Card>

                        <div className={styles.secondaryAction}>
                            <div className={styles.bulkUploadPrompt}>
                                <div>
                                    <h3>Uploading many translations?</h3>
                                    <p>
                                        Use the faster table editor to add many rows at once, or bring in a spreadsheet when you have one.
                                    </p>
                                </div>
                                <Button type="button" variant="secondary" onClick={() => navigate('/contribute/bulk')}>
                                    Add Many Translations
                                </Button>
                            </div>
                            <Button type="button" variant="secondary" fullWidth onClick={() => navigate('/contributions')}>
                                View My Contributions
                            </Button>
                        </div>
                    </div>

                    <div className={styles.missingSidebarColumn}>
                        <MissingWordsSidebar slug={selectedSlug} onWordClick={handleMissingWordClick} />
                    </div>
                </div>
            </div>

            <MissingWordsBottomSheet
                isOpen={mobileSheetOpen}
                onClose={() => setMobileSheetOpen(false)}
                slug={selectedSlug}
                onWordClick={handleMissingWordClick}
            />
        </div>
    );
}

function ReviewRow({ label, value }) {
    if (!value) return null;
    return (
        <div className={styles.reviewRow}>
            <dt className={styles.reviewLabel}>{label}</dt>
            <dd className={styles.reviewValue}>{value}</dd>
        </div>
    );
}
