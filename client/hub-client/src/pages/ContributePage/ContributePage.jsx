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
        partOfSpeech: '',
    });
    const [audioFile, setAudioFile] = useState(null);
    const [audioMode, setAudioMode] = useState('upload'); // 'upload' or 'record'
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

    const MAX_RECORDING_SECONDS = 10;

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => {
                    // Auto-stop at 10 seconds
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

    // Waveform visualization effect
    useEffect(() => {
        let animationId;
        if (isRecording && analyser) {
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateWaveform = () => {
                analyser.getByteTimeDomainData(dataArray);
                setWaveformData(new Uint8Array(dataArray));
                animationId = requestAnimationFrame(updateWaveform);
            };

            updateWaveform();
        }
        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [isRecording, analyser]);

    // Cleanup media recorder on unmount
    useEffect(() => {
        return () => {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            if (audioContext && audioContext.state !== 'closed') {
                audioContext.close();
            }
        };
    }, [mediaRecorder, audioContext]);

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

    const handleAudioChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a'];
            if (!validTypes.includes(file.type)) {
                setErrors({ ...errors, audio: 'Please select a valid audio file (MP3, WAV, OGG, WebM, or M4A)' });
                return;
            }
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setErrors({ ...errors, audio: 'Audio file must be less than 10MB' });
                return;
            }
            setAudioFile(file);
            setAudioBlob(null); // Clear any recorded audio
            if (errors.audio) {
                setErrors({ ...errors, audio: '' });
            }
        }
    };

    const handleAudioModeChange = (mode) => {
        setAudioMode(mode);
        setAudioFile(null);
        setAudioBlob(null);
        setRecordingTime(0);
        if (errors.audio) {
            setErrors({ ...errors, audio: '' });
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Set up audio context for waveform visualization
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyserNode = audioCtx.createAnalyser();
            analyserNode.fftSize = 256;
            source.connect(analyserNode);
            
            setAudioContext(audioCtx);
            setAnalyser(analyserNode);
            
            const recorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm'
            });
            
            const chunks = [];
            
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };
            
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                
                // Validate size (max 10MB)
                if (blob.size > 10 * 1024 * 1024) {
                    setErrors({ ...errors, audio: 'Recording is too large (max 10MB).' });
                    setAudioBlob(null);
                } else {
                    setAudioBlob(blob);
                    setAudioFile(null); // Clear any uploaded file
                    if (errors.audio) {
                        setErrors({ ...errors, audio: '' });
                    }
                }
                
                // Stop all tracks and close audio context
                stream.getTracks().forEach(track => track.stop());
                if (audioCtx && audioCtx.state !== 'closed') {
                    audioCtx.close();
                }
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
        if (errors.audio) {
            setErrors({ ...errors, audio: '' });
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const validate = () => {
        const newErrors = {};
        
        if (!formData.languageId) newErrors.languageId = 'Please select a language';
        if (!formData.wordText) newErrors.wordText = 'Word is required';
        if (!formData.englishDefinition) newErrors.englishDefinition = 'Definition is required';
        
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
        setUploadProgress(0);
        
        try {
            let audioS3Key = null;

            const audioToUpload = audioFile || (audioBlob ? new File([audioBlob], 'recording.webm', { type: 'audio/webm' }) : null);
            
            if (audioToUpload) {
                setUploadingAudio(true);
                setUploadProgress(10);
                
                try {
                    // Simulate progress during upload
                    const progressInterval = setInterval(() => {
                        setUploadProgress(prev => {
                            if (prev >= 90) return prev;
                            return prev + 10;
                        });
                    }, 200);

                    audioS3Key = await contributionService.uploadAudio(audioToUpload);
                    
                    clearInterval(progressInterval);
                    setUploadProgress(100);
                } catch (uploadError) {
                    setErrors({
                        submit: 'Failed to upload audio file. Please try again.',
                    });
                    setLoading(false);
                    setUploadingAudio(false);
                    setUploadProgress(0);
                    return;
                }
                
                // Small delay to show 100% progress
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
                ipa: '',
                englishDefinition: '',
                exampleSentence: '',
                partOfSpeech: '',
            });
            setAudioFile(null);
            setAudioBlob(null);
            setRecordingTime(0);
            setUploadProgress(0);

            const fileInput = document.getElementById('audioFile');
            if (fileInput) fileInput.value = '';
            
            setTimeout(() => setSuccess(false), 5000);
        } 
        catch (err) {
            setErrors({
                submit: err.response?.data?.message || err.message || 'Failed to submit contribution. Please try again.',
            });
        } 
        finally {
            setLoading(false);
            setUploadingAudio(false);
            setUploadProgress(0);
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
                    <div>Required fields are labeled with a *</div>
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

                        <div className={styles.formGroup}>
                            <label htmlFor="partOfSpeech" className={styles.label}>
                                Part of Speech
                            </label>
                            <select
                                id="partOfSpeech"
                                name="partOfSpeech"
                                value={formData.partOfSpeech}
                                onChange={handleChange}
                                className={styles.select}
                            >
                                <option value="">Select part of speech</option>
                                <option value="noun">Noun</option>
                                <option value="verb">Verb</option>
                                <option value="adjective">Adjective</option>
                                <option value="adverb">Adverb</option>
                                <option value="pronoun">Pronoun</option>
                                <option value="preposition">Preposition</option>
                                <option value="conjunction">Conjunction</option>
                                <option value="interjection">Interjection</option>
                                <option value="particle">Particle</option>
                                <option value="phrase">Phrase</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

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
                                Example Sentence 
                            </label>
                            <textarea
                                id="exampleSentence"
                                name="exampleSentence"
                                value={formData.exampleSentence}
                                onChange={handleChange}
                                className={styles.textarea}
                                rows="3"
                                required
                                placeholder="Optional: Show how this word is used in context"
                            />
                            {errors.exampleSentence && (
                                <span className={styles.errorText}>{errors.exampleSentence}</span>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Audio Pronunciation
                            </label>
                            
                            {/* Mode Selector */}
                            <div className={styles.audioModeSelector}>
                                <button
                                    type="button"
                                    className={`${styles.modeButton} ${audioMode === 'upload' ? styles.modeButtonActive : ''}`}
                                    onClick={() => handleAudioModeChange('upload')}
                                >
                                    📁 Upload File
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.modeButton} ${audioMode === 'record' ? styles.modeButtonActive : ''}`}
                                    onClick={() => handleAudioModeChange('record')}
                                >
                                    🎤 Record Audio
                                </button>
                            </div>

                            {/* Upload Mode */}
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
                                            <span>✓ {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAudioFile(null);
                                                    const fileInput = document.getElementById('audioFile');
                                                    if (fileInput) fileInput.value = '';
                                                }}
                                                className={styles.deleteButton}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                    <p className={styles.hint}>Max 10MB • MP3, WAV, OGG, WebM, or M4A</p>
                                </div>
                            )}

                            {/* Record Mode */}
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
                                                        <span className={styles.recordIcon}>⏺</span>
                                                        Start Recording
                                                    </button>
                                                ) : (
                                                    <>
                                                        <div className={styles.recordingContainer}>
                                                            {/* Waveform Visualization */}
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

                                                            {/* Recording Timer with Progress */}
                                                            <div className={styles.recordingInfo}>
                                                                <div className={styles.recordingIndicator}>
                                                                    <span className={styles.recordingDot}></span>
                                                                    Recording: {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_SECONDS)}
                                                                </div>
                                                                <div className={styles.recordingProgress}>
                                                                    <div 
                                                                        className={styles.recordingProgressBar}
                                                                        style={{ width: `${(recordingTime / MAX_RECORDING_SECONDS) * 100}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={stopRecording}
                                                            className={styles.stopButton}
                                                        >
                                                            <span className={styles.stopIcon}>⏹</span>
                                                            Stop Recording
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                            <p className={styles.hint}>Max {MAX_RECORDING_SECONDS} seconds • Click allow when prompted for microphone access</p>
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
                                                <button
                                                    type="button"
                                                    onClick={deleteRecording}
                                                    className={styles.reRecordButton}
                                                >
                                                    🔄 Re-record
                                                </button>
                                                <div className={styles.recordingInfo}>
                                                    <span>✓ Ready to upload ({(audioBlob.size / 1024).toFixed(1)} KB)</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {errors.audio && (
                                <span className={styles.errorText}>{errors.audio}</span>
                            )}
                        </div>

                        <div className={styles.actions}>
                            <Button type="submit" fullWidth disabled={loading || languagesLoading}>
                                {uploadingAudio ? (
                                    <span className={styles.uploadingText}>
                                        Uploading Audio... {uploadProgress}%
                                    </span>
                                ) : loading ? 'Submitting...' : 'Submit Contribution'}
                            </Button>
                            
                            {uploadingAudio && (
                                <div className={styles.uploadProgressBar}>
                                    <div 
                                        className={styles.uploadProgressFill}
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            )}
                            
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