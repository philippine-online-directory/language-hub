import { useState, useEffect } from 'react';
import Button from '../Button/Button';
import Card from '../Card/Card';
import styles from './ContributeMissingModal.module.css';
import Input from '../Input/Input';
import { contributionService } from '../../api/contributionService';
import { POS_OPTIONS } from '../../data/partsOfSpeech';

export default function ContributeMissingModal({ translation, fieldsToContribute, onClose, onComplete }){
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
    const [uploadingAudio, setUploadingAudio] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    
    const MAX_RECORDING_SECONDS = 10;

    const [formData, setFormData] = useState({
        exampleSentence: '',
        partOfSpeech: '',
        usageComment: ''
    });

    const cleanFormData = (data) => {
      return Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== '')
      );
    };

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
        
        try {
          if (
              !formData.partOfSpeech &&
              !formData.usageComment &&
              !formData.exampleSentence &&
              !(audioFile || (audioBlob ? new File([audioBlob], 'recording.webm', { type: 'audio/webm' }) : null))
            ) {
              newErrors.submit = 'Please contribute at least one field.';
            }
          } catch (err) {
            console.error('Validation error:', err);
            newErrors.submit = 'Something went wrong while validating your contribution.';
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
            } catch {
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
        
        const updatedTranslation = await contributionService.completeMissingFields(
          translation.id,
          {
            ...cleanFormData(formData),
            ...(audioS3Key ? { audioUrl: audioS3Key } : {})
          }
        );

        onComplete(updatedTranslation);

        setSuccess(true);
        setErrors({});
        setFormData({
          exampleSentence: '',
          partOfSpeech: '',
          usageComment: ''
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

    }


    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <Card className={styles.modal} onClick={(e) => e.stopPropagation()} asDiv>
                <h2 className={styles.title}>Contribute</h2>
                <p className={styles.subtitle}>
                    Contribute missing fields for "<strong>{translation.wordText}</strong>"
                </p>

                
                {success && (
                    <div className={styles.success}>
                        Missing fields added successfully. Thank you for your contribution!
                    </div>
                )}

                {errors.submit && <div className={styles.error}>{errors.submit}</div>}

                <form noValidate onSubmit={handleSubmit} className={styles.form}>
                    {fieldsToContribute.includes('partOfSpeech') && (
                      <div className={styles.formGroup}>
                          <label htmlFor="partOfSpeech" className={styles.label}>
                              Part of Speech <span className={styles.optional}>(optional)</span>
                          </label>
                          <select
                              id="partOfSpeech"
                              name="partOfSpeech"
                              value={formData.partOfSpeech}
                              onChange={handleChange}
                              className={styles.select}
                          >
                              <option value="">Select part of speech</option>
                              {POS_OPTIONS.map(option => (
                                  <option key={option.value} value={option.value} title={option.definition}>
                                      {option.label}
                                  </option>
                              ))}
                          </select>
                      </div>
                    )}

                    {fieldsToContribute.includes('exampleSentence') && (
                      <div className={styles.formGroup}>
                        <label htmlFor="exampleSentence" className={styles.label}>
                            Example Sentence <span className={styles.optional}>(optional)</span>
                        </label>
                        <textarea
                            id="exampleSentence"
                            name="exampleSentence"
                            value={formData.exampleSentence}
                            onChange={handleChange}
                            className={styles.textarea}
                            rows="3"
                            placeholder="Optional: Show how this word is used in context"
                        />
                        {errors.exampleSentence && (
                            <span className={styles.errorText}>{errors.exampleSentence}</span>
                        )}
                      </div>
                    )}

                    {fieldsToContribute.includes('usageComment') && (
                      <div className={styles.formGroup}>
                          <label htmlFor="usageComment" className={styles.label}>
                              Usage Comment <span className={styles.optional}>(optional)</span>
                          </label>
                          <textarea
                              id="usageComment"
                              name="usageComment"
                              value={formData.usageComment}
                              onChange={handleChange}
                              className={styles.textarea}
                              rows="3"
                              placeholder="Optional: Give a short note on when/how to use this word"
                          />
                          {errors.usageComment && (
                              <span className={styles.errorText}>{errors.usageComment}</span>
                          )}
                      </div>
                    )}

                    {fieldsToContribute.includes('audioUrl') && (
                      <div className={styles.formGroup}>
                          <label className={styles.label}>
                              Audio Pronunciation <span className={styles.optional}>(optional)</span>
                          </label>
                          
                          {/* Mode Selector */}
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
                                              aria-label="Remove file"
                                          >
                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                                                  <line x1="18" y1="6" x2="6" y2="18" />
                                                  <line x1="6" y1="6" x2="18" y2="18" />
                                              </svg>
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
                                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                          <circle cx="12" cy="12" r="8" />
                                                      </svg>
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
                                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                              <rect x="4" y="4" width="16" height="16" rx="2" />
                                                          </svg>
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
                                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                      <polyline points="1 4 1 10 7 10" />
                                                      <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
                                                  </svg>
                                                  Re-record
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
                    )}

                <div className={styles.actions}>
                    <Button type="submit" fullWidth loading={loading || uploadingAudio} disabled={isRecording}>
                        {uploadingAudio ? `Uploading Audio… ${uploadProgress}%` : 'Submit Contribution'}
                    </Button>
                      
                      {uploadingAudio && (
                          <div className={styles.uploadProgressBar}>
                              <div 
                                  className={styles.uploadProgressFill}
                                  style={{ width: `${uploadProgress}%` }}
                              ></div>
                          </div>
                      )}
                    <Button variant="secondary" onClick={onClose} fullWidth>
                        Cancel
                    </Button>
                </div>

                </form>
              
                
            </Card>
        </div>
    );
}
