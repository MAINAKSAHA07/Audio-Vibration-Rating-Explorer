import React, { useState, useRef, useEffect } from 'react';
import WaveSurferPlayer from './WaveSurferPlayer';
import vibrationService, { 
  VibrationGenerationResponse, 
  VibrationResult, 
  BackendHealth 
} from '../utils/vibrationService';

// Vibration WaveSurfer Player Component
interface VibrationWaveSurferPlayerProps {
  filename: string;
  title: string;
  onPrepareAudio: (filename: string) => Promise<string | null>;
}

const VibrationWaveSurferPlayer: React.FC<VibrationWaveSurferPlayerProps> = ({ 
  filename, 
  title, 
  onPrepareAudio 
}) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAudio = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const url = await onPrepareAudio(filename);
        if (url) {
          setAudioUrl(url);
        } else {
          setError('Failed to load audio');
        }
      } catch (err) {
        setError('Failed to load audio');
      } finally {
        setIsLoading(false);
      }
    };

    loadAudio();
  }, [filename, onPrepareAudio]);

  if (isLoading) {
    return (
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #dee2e6',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '20px', marginBottom: '10px' }}>⏳</div>
        <p style={{ margin: '0', color: '#6c757d', fontSize: '14px' }}>Loading vibration waveform...</p>
      </div>
    );
  }

  if (error || !audioUrl) {
    return (
      <div style={{
        backgroundColor: '#f8d7da',
        color: '#721c24',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #f5c6cb',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '20px', marginBottom: '10px' }}>⚠️</div>
        <p style={{ margin: '0', fontSize: '14px' }}>{error || 'Audio not available'}</p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      padding: '15px',
      borderRadius: '8px',
      border: '1px solid #dee2e6'
    }}>
      <h5 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '14px' }}>{title}</h5>
      <WaveSurferPlayer
        audioUrl={audioUrl}
        title={title}
        height={80}
      />
    </div>
  );
};




   


interface AudioUploadProps {
  // Add any props if needed
}

const AudioUpload: React.FC<AudioUploadProps> = () => {
  const [uploadedAudio, setUploadedAudio] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  
  // New state for vibration generation
  const [isGeneratingVibrations, setIsGeneratingVibrations] = useState(false);
  const [vibrationResults, setVibrationResults] = useState<VibrationGenerationResponse | null>(null);
  const [vibrationError, setVibrationError] = useState<string | null>(null);
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
  const [isBackendAvailable, setIsBackendAvailable] = useState<boolean | null>(null);
  
  // Audio playback state
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map());
  
  // Vibration audio URLs for WaveSurfer
  const [vibrationAudioUrls, setVibrationAudioUrls] = useState<Map<string, string>>(new Map());
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check backend health on component mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      // Clean up audio elements
      audioElements.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      // Clean up vibration audio URLs
      vibrationAudioUrls.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [audioUrl, audioElements, vibrationAudioUrls]);

  const checkBackendHealth = async () => {
    try {
      console.log('🔍 Checking backend health...');
      const health = await vibrationService.checkHealth();
      console.log('✅ Backend health check successful:', health);
      setBackendHealth(health);
      setIsBackendAvailable(true);
    } catch (error) {
      console.warn('❌ Backend not available:', error);
      setIsBackendAvailable(false);
      setBackendHealth(null);
      
      // Check if it's a mixed content error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Mixed Content') || errorMessage.includes('blocked') || errorMessage.includes('CORS')) {
        console.log('🔒 Mixed content error detected - backend is running but blocked by browser');
        // Don't set vibration error here, just mark as unavailable
      }
    }
  };


  // Generate vibrations using Python algorithms
  const generateVibrations = async (file: File) => {
    if (!isBackendAvailable) {
      setVibrationError('Backend service is not available. Please start the Python backend first.');
      return;
    }

    try {
      console.log('🎵 Starting vibration generation for:', file.name);
      setIsGeneratingVibrations(true);
      setVibrationError(null);
      setVibrationResults(null);

      const results = await vibrationService.generateVibrations(file);
      console.log('✅ Vibration generation completed:', results);
      setVibrationResults(results);
      
      // Refresh backend health
      await checkBackendHealth();
      
    } catch (error) {
      console.error('❌ Error generating vibrations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate vibrations';
      setVibrationError(errorMessage);
      
      // Check if it's a mixed content error
      if (errorMessage.includes('Mixed Content') || errorMessage.includes('blocked') || errorMessage.includes('CORS')) {
        setVibrationError('🔒 Mixed Content Error: Your browser is blocking the connection to the HTTP backend from this HTTPS site. This is a security feature. To fix this, you can: 1) Use a different browser, 2) Disable mixed content blocking in your browser settings, or 3) Access the site via HTTP instead of HTTPS.');
      }
    } finally {
      setIsGeneratingVibrations(false);
    }
  };

  const processAudioFile = (file: File) => {
    try {
      console.log('🎵 Processing audio file:', file.name, 'Size:', file.size);
      
      setIsUploading(true);
      setError(null);
      setVibrationError(null);
      setVibrationResults(null);

      // Create object URL for the uploaded file
      const url = URL.createObjectURL(file);
      setUploadedAudio(file);
      setAudioUrl(url);
      setIsUploading(false);
      
      // Get audio duration
      const audio = new Audio(url);
      audio.addEventListener('loadedmetadata', () => {
        setAudioDuration(audio.duration);
      });
      audio.addEventListener('error', () => {
        setAudioDuration(null);
      });

      
      // Generate vibrations if backend is available
      if (isBackendAvailable) {
        console.log('🚀 Backend is available, starting vibration generation...');
        generateVibrations(file);
      } else {
        console.log('⚠️ Backend is not available, skipping vibration generation');
        setVibrationError('Backend service is not available. Please check the connection.');
      }
    } catch (error) {
      console.error('❌ Error processing audio file:', error);
      setError(`Failed to process audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsUploading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      setError('Please select a valid audio file (MP3, WAV, OGG, etc.)');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('File size must be less than 50MB');
      return;
    }

    processAudioFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      setError('Please select a valid audio file (MP3, WAV, OGG, etc.)');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('File size must be less than 50MB');
      return;
    }

    processAudioFile(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };


  const handleClearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    // Clean up vibration audio URLs
    vibrationAudioUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    
    setUploadedAudio(null);
    setAudioUrl(null);
    setError(null);
    setAudioDuration(null);
    setVibrationResults(null);
    setVibrationError(null);
    setVibrationAudioUrls(new Map());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleDownloadVibration = async (algorithm: string) => {
    if (!uploadedAudio) {
      alert('No audio file available for download');
      return;
    }

    try {
      const blob = await vibrationService.generateAndDownload(uploadedAudio, algorithm);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${algorithm}_${uploadedAudio.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handlePlayVibration = async (filename: string) => {
    try {
      // Stop any currently playing audio
      if (playingAudio && playingAudio !== filename) {
        const currentAudio = audioElements.get(playingAudio);
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
      }

      let audioElement = audioElements.get(filename);
      
      if (!audioElement) {
        // Download and create audio element
        const blob = await vibrationService.downloadVibration(filename);
        const url = URL.createObjectURL(blob);
        
        audioElement = new Audio(url);
        audioElement.preload = 'metadata';
        
        // Store the audio element
        setAudioElements(prev => new Map(prev).set(filename, audioElement!));
        
        // Clean up URL when audio is done
        audioElement.addEventListener('ended', () => {
          setPlayingAudio(null);
        });
        
        audioElement.addEventListener('error', () => {
          console.error('Audio playback error:', audioElement?.error);
          setPlayingAudio(null);
        });
      }

      if (playingAudio === filename) {
        // Pause if already playing
        audioElement.pause();
        setPlayingAudio(null);
      } else {
        // Play the audio
        audioElement.currentTime = 0;
        await audioElement.play();
        setPlayingAudio(filename);
      }
    } catch (error) {
      console.error('Playback failed:', error);
      alert('Playback failed. Please try again.');
    }
  };

  // Function to prepare vibration files for WaveSurfer
  const prepareVibrationForWaveSurfer = async (filename: string) => {
    try {
      // Check if we already have the URL
      if (vibrationAudioUrls.has(filename)) {
        return vibrationAudioUrls.get(filename);
      }

      if (!uploadedAudio) {
        console.error('No uploaded audio available');
        return null;
      }

      // Extract algorithm from filename (e.g., "freqshift_audio.wav" -> "freqshift")
      const algorithm = filename.split('_')[0];
      
      // Generate and download the vibration file
      const blob = await vibrationService.generateAndDownload(uploadedAudio, algorithm);
      const url = URL.createObjectURL(blob);
      
      // Store the URL
      setVibrationAudioUrls(prev => new Map(prev).set(filename, url));
      
      return url;
    } catch (error) {
      console.error('Failed to prepare vibration for WaveSurfer:', error);
      
      // Handle mixed content errors with user-friendly message
      if ((error as any)?.isMixedContentError) {
        console.error('Mixed content error detected. Solutions:', (error as any).solutions);
        // You could show a user-friendly modal here with the solutions
      }
      
      return null;
    }
  };

  const renderVibrationResults = () => {
    if (!vibrationResults) return null;

    return (
      <div className="vibration-results" style={{ marginTop: '30px' }}>
        <h3 style={{ color: '#333', marginBottom: '15px' }}>
          🎯 Generated Vibrations
        </h3>
        
        <div style={{
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '15px',
          borderRadius: '4px',
          border: '1px solid #c3e6cb',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>✅ {vibrationResults.message}</h4>
          <p style={{ margin: '5px 0' }}><strong>Original file:</strong> {vibrationResults.original_file}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Frequency Shifting Results */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>🎵 Frequency Shifting Algorithm</h4>
            {vibrationResults.results.freqshift && 'error' in vibrationResults.results.freqshift ? (
              <div style={{ color: '#dc3545' }}>
                ❌ Error: {vibrationResults.results.freqshift.error}
              </div>
                         ) : vibrationResults.results.freqshift && !('error' in vibrationResults.results.freqshift) ? (
               <div>
                 <p style={{ margin: '5px 0' }}><strong>File:</strong> {vibrationResults.results.freqshift.filename}</p>
                 <p style={{ margin: '5px 0' }}><strong>Size:</strong> {formatFileSize(vibrationResults.results.freqshift.size)}</p>
                 
                 {/* WaveSurfer Player for Vibration */}
                 <div style={{ marginTop: '15px' }}>
                   <VibrationWaveSurferPlayer
                     filename={(vibrationResults.results.freqshift as VibrationResult).filename}
                     title="Frequency Shifting Vibration"
                     onPrepareAudio={prepareVibrationForWaveSurfer}
                   />
                 </div>
                 
                 <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                   <button
                     onClick={() => handleDownloadVibration('freqshift')}
                     style={{
                       backgroundColor: '#007bff',
                       color: 'white',
                       border: 'none',
                       borderRadius: '4px',
                       padding: '8px 16px',
                       cursor: 'pointer',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '5px'
                     }}
                   >
                     📥 Download
                   </button>
                 </div>
              </div>
            ) : (
              <div style={{ color: '#6c757d' }}>No results available</div>
            )}
          </div>

          {/* HapticGen Results */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>🎛️ HapticGen Algorithm</h4>
            {vibrationResults.results.hapticgen && 'error' in vibrationResults.results.hapticgen ? (
              <div style={{ color: '#dc3545' }}>
                ❌ Error: {vibrationResults.results.hapticgen.error}
              </div>
                         ) : vibrationResults.results.hapticgen && !('error' in vibrationResults.results.hapticgen) ? (
               <div>
                 <p style={{ margin: '5px 0' }}><strong>File:</strong> {vibrationResults.results.hapticgen.filename}</p>
                 <p style={{ margin: '5px 0' }}><strong>Size:</strong> {formatFileSize(vibrationResults.results.hapticgen.size)}</p>
                 
                 {/* WaveSurfer Player for Vibration */}
                 <div style={{ marginTop: '15px' }}>
                   <VibrationWaveSurferPlayer
                     filename={(vibrationResults.results.hapticgen as VibrationResult).filename}
                     title="HapticGen Vibration"
                     onPrepareAudio={prepareVibrationForWaveSurfer}
                   />
                 </div>
                 
                 <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                   <button
                     onClick={() => handleDownloadVibration('hapticgen')}
                     style={{
                       backgroundColor: '#007bff',
                       color: 'white',
                       border: 'none',
                       borderRadius: '4px',
                       padding: '8px 16px',
                       cursor: 'pointer',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '5px'
                     }}
                   >
                     📥 Download
                   </button>
                 </div>
              </div>
            ) : (
              <div style={{ color: '#6c757d' }}>No results available</div>
            )}
          </div>

          {/* Percept Results */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>🧠 Perception-Level Mapping Algorithm</h4>
            {vibrationResults.results.percept && 'error' in vibrationResults.results.percept ? (
              <div style={{ color: '#dc3545' }}>
                ❌ Error: {vibrationResults.results.percept.error}
              </div>
                         ) : vibrationResults.results.percept && !('error' in vibrationResults.results.percept) ? (
               <div>
                 <p style={{ margin: '5px 0' }}><strong>File:</strong> {vibrationResults.results.percept.filename}</p>
                 <p style={{ margin: '5px 0' }}><strong>Size:</strong> {formatFileSize(vibrationResults.results.percept.size)}</p>
                 
                 {/* WaveSurfer Player for Vibration */}
                 <div style={{ marginTop: '15px' }}>
                   <VibrationWaveSurferPlayer
                     filename={(vibrationResults.results.percept as VibrationResult).filename}
                     title="Perception-Based Vibration"
                     onPrepareAudio={prepareVibrationForWaveSurfer}
                   />
                 </div>
                 
                 <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                   <button
                     onClick={() => handleDownloadVibration('percept')}
                     style={{
                       backgroundColor: '#007bff',
                       color: 'white',
                       border: 'none',
                       borderRadius: '4px',
                       padding: '8px 16px',
                       cursor: 'pointer',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '5px'
                     }}
                   >
                     📥 Download
                   </button>
                 </div>
              </div>
            ) : (
              <div style={{ color: '#6c757d' }}>No results available</div>
            )}
          </div>

          {/* Pitch Results */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>🎼 Pitch Matching Algorithm</h4>
            {vibrationResults.results.pitch && 'error' in vibrationResults.results.pitch ? (
              <div style={{ color: '#dc3545' }}>
                ❌ Error: {vibrationResults.results.pitch.error}
              </div>
                         ) : vibrationResults.results.pitch && !('error' in vibrationResults.results.pitch) ? (
               <div>
                 <p style={{ margin: '5px 0' }}><strong>File:</strong> {vibrationResults.results.pitch.filename}</p>
                 <p style={{ margin: '5px 0' }}><strong>Size:</strong> {formatFileSize(vibrationResults.results.pitch.size)}</p>
                 
                 {/* WaveSurfer Player for Vibration */}
                 <div style={{ marginTop: '15px' }}>
                   <VibrationWaveSurferPlayer
                     filename={(vibrationResults.results.pitch as VibrationResult).filename}
                     title="Pitch Matching Vibration"
                     onPrepareAudio={prepareVibrationForWaveSurfer}
                   />
                 </div>
                 
                 <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                   <button
                     onClick={() => handleDownloadVibration('pitch')}
                     style={{
                       backgroundColor: '#007bff',
                       color: 'white',
                       border: 'none',
                       borderRadius: '4px',
                       padding: '8px 16px',
                       cursor: 'pointer',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '5px'
                     }}
                   >
                     📥 Download
                   </button>
                 </div>
              </div>
            ) : (
              <div style={{ color: '#6c757d' }}>No results available</div>
            )}
          </div>

          {/* Model 1 Results (Top-Rated Sound2Hap) */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>🤖 Top-Pair Sound2Hap </h4>
            {vibrationResults.results.model1 && 'error' in vibrationResults.results.model1 ? (
              <div style={{ color: '#dc3545' }}>
                ❌ Error: {vibrationResults.results.model1.error}
              </div>
                         ) : vibrationResults.results.model1 && !('error' in vibrationResults.results.model1) ? (
               <div>
                 <p style={{ margin: '5px 0' }}><strong>File:</strong> {vibrationResults.results.model1.filename}</p>
                 <p style={{ margin: '5px 0' }}><strong>Size:</strong> {formatFileSize(vibrationResults.results.model1.size)}</p>
                 
                 {/* WaveSurfer Player for Vibration */}
                 <div style={{ marginTop: '15px' }}>
                   <VibrationWaveSurferPlayer
                     filename={(vibrationResults.results.model1 as VibrationResult).filename}
                     title="Top-Pair Sound2Hap Vibration"
                     onPrepareAudio={prepareVibrationForWaveSurfer}
                   />
                 </div>
                 
                 <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                   <button
                     onClick={() => handleDownloadVibration('model1')}
                     style={{
                       backgroundColor: '#007bff',
                       color: 'white',
                       border: 'none',
                       borderRadius: '4px',
                       padding: '8px 16px',
                       cursor: 'pointer',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '5px'
                     }}
                   >
                     📥 Download
                   </button>
                 </div>
              </div>
            ) : (
              <div style={{ color: '#6c757d' }}>No results available</div>
            )}
          </div>

          {/* Model 2 Results (Preference-Weighted Sound2Hap) */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>🧠 Preference-Weighted Sound2Hap</h4>
            {vibrationResults.results.model2 && 'error' in vibrationResults.results.model2 ? (
              <div style={{ color: '#dc3545' }}>
                ❌ Error: {vibrationResults.results.model2.error}
              </div>
                         ) : vibrationResults.results.model2 && !('error' in vibrationResults.results.model2) ? (
               <div>
                 <p style={{ margin: '5px 0' }}><strong>File:</strong> {vibrationResults.results.model2.filename}</p>
                 <p style={{ margin: '5px 0' }}><strong>Size:</strong> {formatFileSize(vibrationResults.results.model2.size)}</p>
                 
                 {/* WaveSurfer Player for Vibration */}
                 <div style={{ marginTop: '15px' }}>
                   <VibrationWaveSurferPlayer
                     filename={(vibrationResults.results.model2 as VibrationResult).filename}
                     title="Preference-Weighted Sound2Hap Vibration"
                     onPrepareAudio={prepareVibrationForWaveSurfer}
                   />
                 </div>
                 
                 <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                   <button
                     onClick={() => handleDownloadVibration('model2')}
                     style={{
                       backgroundColor: '#007bff',
                       color: 'white',
                       border: 'none',
                       borderRadius: '4px',
                       padding: '8px 16px',
                       cursor: 'pointer',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '5px'
                     }}
                   >
                     📥 Download
                   </button>
                 </div>
              </div>
            ) : (
              <div style={{ color: '#6c757d' }}>No results available</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="audio-upload-container" style={{
      padding: '20px',
      maxWidth: '1000px',
      margin: '0 auto'
    }}>
      <div className="upload-section" style={{
        marginBottom: '30px'
      }}>
        <h2 style={{
          color: '#333',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          🎵 Audio Upload & Vibration Generation
        </h2>
        
        <p style={{
          color: '#666',
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          Upload any audio file to generate vibrations using our Python algorithms
        </p>

        {/* Backend Status */}
        <div style={{
          backgroundColor: isBackendAvailable ? '#d4edda' : '#f8d7da',
          color: isBackendAvailable ? '#155724' : '#721c24',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: `1px solid ${isBackendAvailable ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>
            {isBackendAvailable ? '🟢 Backend Service Available' : '🔴 Backend Service Unavailable'}
          </h4>
          {isBackendAvailable && backendHealth ? (
            <div>
              <p style={{ margin: '5px 0' }}><strong>Status:</strong> {backendHealth.status}</p>
              <p style={{ margin: '5px 0' }}><strong>Algorithms:</strong> Frequency Shifting Algorithm, HapticGen Algorithm, Perception-Level Mapping Algorithm, Pitch Matching Algorithm, Top-Pair Sound2Hap, Preference-Weighted Sound2Hap</p>
              <p style={{ margin: '5px 0' }}>{backendHealth.message}</p>
            </div>
          ) : (
            <div>
              <p style={{ margin: '5px 0' }}>
                🔒 Backend connection blocked by browser security (Mixed Content Policy)
              </p>
            </div>
          )}
        </div>

        {/* Upload Area */}
        <div
          className={`upload-area ${isDragOver ? 'dragover' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: '2px dashed #ccc',
            borderRadius: '8px',
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginBottom: '20px'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎵</div>
          <p style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>
            {isUploading ? 'Uploading...' : 
             isDragOver ? 'Drop your audio file here!' : 
             'Drop your audio file here or click to browse'}
          </p>
          <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
            Supports MP3, WAV, OGG, and other audio formats (max 50MB)
          </p>
          {isBackendAvailable && (
            <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#28a745', fontWeight: 'bold' }}>
              ✨ Vibration generation will be automatic!
            </p>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* File Info */}
        {uploadedAudio && (
          <div style={{
            backgroundColor: '#d1ecf1',
            color: '#0c5460',
            padding: '15px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #bee5eb'
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>📁 File Information</h4>
            <p style={{ margin: '5px 0' }}><strong>Name:</strong> {uploadedAudio.name}</p>
            <p style={{ margin: '5px 0' }}><strong>Size:</strong> {formatFileSize(uploadedAudio.size)}</p>
            <p style={{ margin: '5px 0' }}><strong>Type:</strong> {uploadedAudio.type}</p>
            {audioDuration && (
              <p style={{ margin: '5px 0' }}><strong>Duration:</strong> {formatDuration(audioDuration)}</p>
            )}
            <button
              onClick={handleClearAudio}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              🗑️ Clear Audio
            </button>
          </div>
        )}
      </div>

      {/* Audio Player */}
      {audioUrl && (
        <div className="player-section">
          <h3 style={{
            color: '#333',
            marginBottom: '15px'
          }}>
            🎧 Audio Player
          </h3>
          <WaveSurferPlayer
            audioUrl={audioUrl}
            title={uploadedAudio?.name || 'Uploaded Audio'}
          />
        </div>
      )}


      {/* Vibration Generation Status */}
      {isGeneratingVibrations && (
        <div className="vibration-generation" style={{ marginTop: '30px' }}>
          <h3 style={{
            color: '#333',
            marginBottom: '15px'
          }}>
            🎯 Generating Vibrations
          </h3>
          
          <div style={{
            backgroundColor: '#e2e3e5',
            color: '#383d41',
            padding: '20px',
            borderRadius: '4px',
            border: '1px solid #d6d8db',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
            <p style={{ margin: '0' }}>Processing audio with Python algorithms...</p>
            <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#6c757d' }}>
              This may take a few moments depending on the file size and complexity.
            </p>
          </div>
        </div>
      )}

      {/* Vibration Error */}
      {vibrationError && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '4px',
          border: '1px solid #f5c6cb',
          marginTop: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>⚠️ Vibration Generation Error</h4>
          <p style={{ margin: '0' }}>{vibrationError}</p>
        </div>
      )}

      {/* Vibration Results */}
      {renderVibrationResults()}

    </div>
  );
};

export default AudioUpload;
