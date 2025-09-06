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

// FFT implementation for spectrogram generation
const performFFT = (data: Float32Array): Float32Array => {
  const n = data.length;
  if (n <= 1) return data;

  // Check if n is a power of 2
  if ((n & (n - 1)) !== 0) {
    throw new Error('FFT requires power of 2 length');
  }

  // Bit-reversal permutation
  const reversed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let reversedIndex = 0;
    let temp = i;
    for (let j = 0; j < Math.log2(n); j++) {
      reversedIndex = (reversedIndex << 1) | (temp & 1);
      temp >>= 1;
    }
    reversed[i] = data[reversedIndex];
  }

  // FFT computation
  const result = new Float32Array(n * 2); // Complex numbers: [real, imag, real, imag, ...]
  for (let i = 0; i < n; i++) {
    result[i * 2] = reversed[i]; // Real part
    result[i * 2 + 1] = 0; // Imaginary part
  }

  for (let size = 2; size <= n; size *= 2) {
    const halfSize = size / 2;
    const angleStep = (-2 * Math.PI) / size;

    for (let start = 0; start < n; start += size) {
      for (let i = 0; i < halfSize; i++) {
        const angle = angleStep * i;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const evenIndex = start + i;
        const oddIndex = start + i + halfSize;

        const evenReal = result[evenIndex * 2];
        const evenImag = result[evenIndex * 2 + 1];
        const oddReal = result[oddIndex * 2];
        const oddImag = result[oddIndex * 2 + 1];

        const tempReal = cos * oddReal - sin * oddImag;
        const tempImag = cos * oddImag + sin * oddReal;

        result[evenIndex * 2] = evenReal + tempReal;
        result[evenIndex * 2 + 1] = evenImag + tempImag;
        result[oddIndex * 2] = evenReal - tempReal;
        result[evenIndex * 2 + 1] = evenImag - tempImag;
      }
    }
  }

  return result;
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
  const [spectrogramData, setSpectrogramData] = useState<number[][]>([]);
  const [isGeneratingSpectrogram, setIsGeneratingSpectrogram] = useState(false);
  const [spectrogramError, setSpectrogramError] = useState<string | null>(null);
  
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
  const spectrogramCanvasRef = useRef<HTMLCanvasElement>(null);

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
      const health = await vibrationService.checkHealth();
      setBackendHealth(health);
      setIsBackendAvailable(true);
    } catch (error) {
      console.warn('Backend not available:', error);
      setIsBackendAvailable(false);
      setBackendHealth(null);
    }
  };

  // Generate spectrogram data from audio buffer
  const generateSpectrogramData = async (audioBuffer: AudioBuffer): Promise<number[][]> => {
    const numberOfSamples = audioBuffer.length;
    const frameSize = 512;
    const hopSize = frameSize / 4;
    const numFrames = Math.floor((numberOfSamples - frameSize) / hopSize);
    const numFreqBins = frameSize / 2;
    
    const spectrogram: number[][] = [];
    const maxFrames = Math.min(numFrames, 100);
    
    // Apply Hanning window function
    const hanningWindow = new Float32Array(frameSize);
    for (let i = 0; i < frameSize; i++) {
      hanningWindow[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (frameSize - 1)));
    }
    
    for (let frame = 0; frame < maxFrames; frame++) {
      const frameData = new Float32Array(frameSize);
      const startSample = frame * hopSize;
      
      // Extract frame data and apply window
      for (let i = 0; i < frameSize; i++) {
        if (startSample + i < numberOfSamples) {
          frameData[i] = audioBuffer.getChannelData(0)[startSample + i] * hanningWindow[i];
        }
      }
      
      // Perform FFT
      const fft = performFFT(frameData);
      const magnitudes = new Float32Array(numFreqBins);
      
      // Calculate magnitude spectrum (only positive frequencies)
      for (let i = 0; i < numFreqBins; i++) {
        const real = fft[i * 2];
        const imag = fft[i * 2 + 1];
        magnitudes[i] = Math.sqrt(real * real + imag * imag);
      }
      
      // Apply logarithmic scaling for better dynamic range
      const maxMagnitude = Math.max(...Array.from(magnitudes));
      const frameMagnitudes = Array.from(magnitudes).map(mag => {
        if (maxMagnitude > 0) {
          const normalized = mag / maxMagnitude;
          return Math.max(0, 20 * Math.log10(normalized + 1e-10) + 60);
        }
        return 0;
      });
      
      spectrogram.push(frameMagnitudes);
    }
    
    return spectrogram;
  };

  // Generate spectrogram for uploaded file
  const generateSpectrogramForFile = async (file: File) => {
    try {
      setIsGeneratingSpectrogram(true);
      setSpectrogramError(null);

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const spectrogramData = await generateSpectrogramData(audioBuffer);
      setSpectrogramData(spectrogramData);
    } catch (err) {
      console.error('Error generating spectrogram:', err);
      setSpectrogramError('Failed to generate spectrogram');
    } finally {
      setIsGeneratingSpectrogram(false);
    }
  };

  // Generate vibrations using Python algorithms
  const generateVibrations = async (file: File) => {
    if (!isBackendAvailable) {
      setVibrationError('Backend service is not available. Please start the Python backend first.');
      return;
    }

    try {
      setIsGeneratingVibrations(true);
      setVibrationError(null);
      setVibrationResults(null);

      const results = await vibrationService.generateVibrations(file);
      setVibrationResults(results);
      
      // Refresh backend health
      await checkBackendHealth();
      
    } catch (error) {
      console.error('Error generating vibrations:', error);
      setVibrationError(error instanceof Error ? error.message : 'Failed to generate vibrations');
    } finally {
      setIsGeneratingVibrations(false);
    }
  };

  const processAudioFile = (file: File) => {
    setIsUploading(true);
    setError(null);
    setSpectrogramError(null);
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

    // Generate spectrogram
    generateSpectrogramForFile(file);
    
    // Generate vibrations if backend is available
    if (isBackendAvailable) {
      generateVibrations(file);
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

  // Draw spectrogram on canvas
  useEffect(() => {
    const canvas = spectrogramCanvasRef.current;
    if (!canvas || spectrogramData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const numFrames = spectrogramData.length;
    const numFreqBins = spectrogramData[0].length;

    const frameWidth = width / numFrames;
    const freqHeight = height / numFreqBins;

    // Find global min/max for proper scaling
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let frame = 0; frame < numFrames; frame++) {
      for (let freq = 0; freq < numFreqBins; freq++) {
        const val = spectrogramData[frame][freq];
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      }
    }

    // Color gradient function
    const getColor = (value: number) => {
      const normalized = (value - minVal) / (maxVal - minVal);
      
      if (normalized < 0.2) {
        const t = normalized / 0.2;
        return `rgb(${Math.round(0 + t * 0)}, ${Math.round(0 + t * 100)}, ${Math.round(100 + t * 155)})`;
      } else if (normalized < 0.4) {
        const t = (normalized - 0.2) / 0.2;
        return `rgb(${Math.round(0 + t * 100)}, ${Math.round(100 + t * 155)}, ${Math.round(255 - t * 100)})`;
      } else if (normalized < 0.6) {
        const t = (normalized - 0.4) / 0.2;
        return `rgb(${Math.round(100 + t * 155)}, ${Math.round(255)}, ${Math.round(155 - t * 155)})`;
      } else if (normalized < 0.8) {
        const t = (normalized - 0.6) / 0.2;
        return `rgb(${Math.round(255)}, ${Math.round(255 - t * 100)}, ${Math.round(0 + t * 100)})`;
      } else {
        const t = (normalized - 0.8) / 0.2;
        return `rgb(${Math.round(255)}, ${Math.round(155 - t * 155)}, ${Math.round(100 + t * 155)})`;
      }
    };

    for (let frame = 0; frame < numFrames; frame++) {
      for (let freq = 0; freq < numFreqBins; freq++) {
        const val = spectrogramData[frame][freq];
        
        ctx.fillStyle = getColor(val);
        ctx.fillRect(
          frame * frameWidth,
          height - (freq + 1) * freqHeight,
          frameWidth,
          freqHeight
        );
      }
    }
  }, [spectrogramData]);

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
    setSpectrogramData([]);
    setSpectrogramError(null);
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
          {/* Frequency Shift Results */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>🎵 Frequency Shift Algorithm</h4>
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
                     title="Frequency Shift Vibration"
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
            <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>🧠 Percept Algorithm</h4>
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
                     title="Percept Vibration"
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
            <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>🎼 PitchMatch Algorithm</h4>
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
                     title="Pitch Vibration"
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
            <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>🤖 Top-Rated Sound2Hap</h4>
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
                     title="Top-Rated Sound2Hap Vibration"
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
              <p style={{ margin: '5px 0' }}><strong>Algorithms:</strong> {backendHealth.algorithms.join(', ')}</p>
              <p style={{ margin: '5px 0' }}>{backendHealth.message}</p>
            </div>
          ) : (
            <div>
              <p style={{ margin: '5px 0' }}>
                Python backend service is not running. Please start it to generate vibrations.
              </p>
              <div style={{ fontSize: '12px', marginTop: '10px' }}>
                <strong>To start the backend:</strong><br/>
                1. Navigate to the backend directory<br/>
                2. Run: <code>python start_backend.py</code><br/>
                3. Or install requirements: <code>pip install -r requirements.txt</code><br/>
                4. Then run: <code>python app.py</code>
              </div>
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

      {/* Spectrogram Analysis */}
      {audioUrl && (
        <div className="spectrogram-section" style={{ marginTop: '30px' }}>
          <h3 style={{
            color: '#333',
            marginBottom: '15px'
          }}>
            📊 Spectrogram Analysis
          </h3>
          
          {isGeneratingSpectrogram && (
            <div style={{
              backgroundColor: '#e2e3e5',
              color: '#383d41',
              padding: '20px',
              borderRadius: '4px',
              border: '1px solid #d6d8db',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
              <p style={{ margin: '0' }}>Generating spectrogram analysis...</p>
            </div>
          )}
          
          {spectrogramError && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '15px',
              borderRadius: '4px',
              border: '1px solid #f5c6cb'
            }}>
              <h4 style={{ margin: '0 0 10px 0' }}>⚠️ Spectrogram Error</h4>
              <p style={{ margin: '0' }}>{spectrogramError}</p>
            </div>
          )}
          
          {spectrogramData.length > 0 && !isGeneratingSpectrogram && (
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>🎵 Frequency Analysis</h4>
              <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>
                This spectrogram shows the frequency content of your audio over time. 
                Brighter colors indicate stronger frequencies at that time and frequency.
              </p>
              <canvas
                ref={spectrogramCanvasRef}
                width={600}
                height={300}
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6',
                  backgroundColor: '#000'
                }}
              />
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                <p style={{ margin: '5px 0' }}><strong>X-axis:</strong> Time (left to right)</p>
                <p style={{ margin: '5px 0' }}><strong>Y-axis:</strong> Frequency (bottom to top)</p>
                <p style={{ margin: '5px 0' }}><strong>Colors:</strong> Blue (low energy) → Green → Yellow → Red (high energy)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {!audioUrl && (
        <div style={{
          backgroundColor: '#e2e3e5',
          color: '#383d41',
          padding: '20px',
          borderRadius: '4px',
          border: '1px solid #d6d8db'
        }}>
          <h4 style={{ margin: '0 0 15px 0' }}>📋 How to Use</h4>
          <ul style={{ margin: '0', paddingLeft: '20px' }}>
            <li>Drag and drop an audio file into the upload area above</li>
            <li>Or click the upload area to browse and select a file</li>
            <li>Supported formats: MP3, WAV, OGG, M4A, FLAC, and more</li>
            <li>Maximum file size: 50MB</li>
            </ul>
          
            {/* 
            <h4 style={{ margin: '20px 0 15px 0' }}>🚀 Starting the Backend</h4>
            <ol style={{ margin: '0', paddingLeft: '20px' }}>
            <li>Open a terminal and navigate to the backend directory</li>
            <li>Install requirements: <code>pip install -r requirements.txt</code></li>
            <li>Start the service: <code>python app.py</code></li>
            <li>The backend will run on <code>http://localhost:5000</code></li>
            </ol>
            */}
        </div>
      )}
    </div>
  );
};

export default AudioUpload;
