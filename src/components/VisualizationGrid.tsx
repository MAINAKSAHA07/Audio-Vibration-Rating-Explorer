import React, { useEffect, useState, useRef, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface VisualizationGridProps {
  audioFiles: Array<{
    id: string;
    audioFile: string;
    vibrationFiles: Array<{
      design: string;
      vibrationFile: string;
      rating: number;
    }>;
  }>;
}

interface VisualizationData {
  id: string;
  audioFile: string;
  waveformData: any;
  spectrogramData: number[][];
  vibrationVisualizations: Array<{
    design: string;
    vibrationFile: string;
    rating: number;
    waveformData: any;
    spectrogramData: number[][];
  }>;
}

const VisualizationGrid: React.FC<VisualizationGridProps> = ({ audioFiles }) => {
  const [visualizations, setVisualizations] = useState<VisualizationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);

  // Generate spectrogram data from audio buffer with proper FFT
  const generateSpectrogramData = async (audioUrl: string): Promise<number[][]> => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const numberOfSamples = audioBuffer.length;
      const frameSize = 512; // Increased for better frequency resolution
      const hopSize = frameSize / 4; // Smaller hop for better time resolution
      const numFrames = Math.floor((numberOfSamples - frameSize) / hopSize);
      const numFreqBins = frameSize / 2;
      
      const spectrogram: number[][] = [];
      const maxFrames = Math.min(numFrames, 100); // More frames for better time resolution
      
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
        
        // Perform FFT using Cooley-Tukey algorithm
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
            // Apply logarithmic scaling: 20 * log10(normalized + 1e-10)
            return Math.max(0, 20 * Math.log10(normalized + 1e-10) + 60);
          }
          return 0;
        });
        
        spectrogram.push(frameMagnitudes);
      }
      
      return spectrogram;
    } catch (error) {
      console.error('Error generating spectrogram for:', audioUrl, error);
      return [];
    }
  };

  // Cooley-Tukey FFT implementation
  const performFFT = (data: Float32Array): Float32Array => {
    const n = data.length;
    if (n === 1) return data;
    
    // Ensure n is a power of 2
    if (n & (n - 1)) {
      throw new Error('FFT requires power of 2 length');
    }
    
    const result = new Float32Array(n * 2); // Complex numbers: [real, imag, real, imag, ...]
    
    // Bit-reversal permutation
    for (let i = 0; i < n; i++) {
      let j = 0;
      let temp = i;
      for (let k = 0; k < Math.log2(n); k++) {
        j = (j << 1) | (temp & 1);
        temp >>= 1;
      }
      result[i * 2] = data[j];
      result[i * 2 + 1] = 0; // Imaginary part
    }
    
    // FFT computation
    for (let step = 1; step < n; step *= 2) {
      const angle = Math.PI / step;
      for (let group = 0; group < n; group += step * 2) {
        for (let pair = group; pair < group + step; pair++) {
          const angle_k = angle * (pair - group);
          const cos_k = Math.cos(angle_k);
          const sin_k = Math.sin(angle_k);
          
          const even_real = result[pair * 2];
          const even_imag = result[pair * 2 + 1];
          const odd_real = result[(pair + step) * 2];
          const odd_imag = result[(pair + step) * 2 + 1];
          
          const temp_real = cos_k * odd_real - sin_k * odd_imag;
          const temp_imag = cos_k * odd_imag + sin_k * odd_real;
          
          result[(pair + step) * 2] = even_real - temp_real;
          result[(pair + step) * 2 + 1] = even_imag - temp_imag;
          result[pair * 2] = even_real + temp_real;
          result[pair * 2 + 1] = even_imag + temp_imag;
        }
      }
    }
    
    return result;
  };

  // Generate all visualizations
  const generateAllVisualizations = useCallback(async () => {
    setLoading(true);
    setProgress(0);
    setError(null);

    const allVisualizations: VisualizationData[] = [];
    const totalFiles = audioFiles.length;

    for (let i = 0; i < audioFiles.length; i++) {
      const audioFile = audioFiles[i];
      setProgress((i / totalFiles) * 100);

      try {
        // Generate audio visualizations
        const audioSpectrogram = await generateSpectrogramData(`/audio/${audioFile.audioFile}`);
        
        // Generate vibration visualizations
        const vibrationVisualizations = [];
        for (const vibration of audioFile.vibrationFiles) {
          const vibrationSpectrogram = await generateSpectrogramData(`/vibration/${vibration.vibrationFile}`);
          vibrationVisualizations.push({
            design: vibration.design,
            vibrationFile: vibration.vibrationFile,
            rating: vibration.rating,
            waveformData: null, // Will be generated by WaveSurfer
            spectrogramData: vibrationSpectrogram,
          });
        }

        allVisualizations.push({
          id: audioFile.id,
          audioFile: audioFile.audioFile,
          waveformData: null, // Will be generated by WaveSurfer
          spectrogramData: audioSpectrogram,
          vibrationVisualizations,
        });

        // Small delay to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error processing file:', audioFile.audioFile, error);
      }
    }

    setVisualizations(allVisualizations);
    setLoading(false);
    setProgress(100);
  }, [audioFiles]);

  const handleAudioSelect = (audioId: string) => {
    setSelectedAudio(audioId);
    generateVisualizationsForAudio(audioId);
  };

  const generateVisualizationsForAudio = useCallback(async (audioId: string) => {
    const audioFile = audioFiles.find(af => af.id === audioId);
    if (!audioFile) return;

    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      // Generate audio visualizations
      const audioSpectrogram = await generateSpectrogramData(`/audio/${audioFile.audioFile}`);
      
      // Generate vibration visualizations
      const vibrationVisualizations = [];
      for (let i = 0; i < audioFile.vibrationFiles.length; i++) {
        const vibration = audioFile.vibrationFiles[i];
        setProgress((i / audioFile.vibrationFiles.length) * 100);
        
        const vibrationSpectrogram = await generateSpectrogramData(`/vibration/${vibration.vibrationFile}`);
        vibrationVisualizations.push({
          design: vibration.design,
          vibrationFile: vibration.vibrationFile,
          rating: vibration.rating,
          waveformData: null,
          spectrogramData: vibrationSpectrogram,
        });

        // Small delay to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setVisualizations([{
        id: audioFile.id,
        audioFile: audioFile.audioFile,
        waveformData: null,
        spectrogramData: audioSpectrogram,
        vibrationVisualizations,
      }]);

      setLoading(false);
      setProgress(100);
    } catch (error) {
      console.error('Error processing audio file:', audioFile.audioFile, error);
      setError('Failed to generate visualizations');
      setLoading(false);
    }
  }, [audioFiles]);

  if (loading) {
    return (
      <div className="visualization-grid">
        <div className="loading-section">
          <h2>🎵 Generating Visualizations</h2>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p>Processing audio file and vibration designs...</p>
          <p className="progress-text">{Math.round(progress)}% Complete</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="visualization-grid">
        <div className="error-section">
          <h2>❌ Error Generating Visualizations</h2>
          <p>{error}</p>
          <button onClick={generateAllVisualizations}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="visualization-grid">
      <div className="grid-header">
        <h2>📊 Visualization Analysis</h2>
        <p>Select an audio file to view its waveform and spectrogram analysis</p>
      </div>
      
      {/* Audio Selection */}
      <div className="audio-selection">
        <h3>Audio Files ({audioFiles.length})</h3>
        <div className="audio-list">
          {audioFiles.map((audio) => (
            <button
              key={audio.id}
              onClick={() => handleAudioSelect(audio.id)}
              className={`audio-button ${selectedAudio === audio.id ? 'selected' : ''}`}
            >
              {audio.id} ({audio.vibrationFiles.length} vibration designs)
            </button>
          ))}
        </div>
      </div>
      
      {/* Visualizations */}
      {visualizations.length > 0 && (
        <div className="visualization-cards">
          {visualizations.map((visualization) => (
            <div key={visualization.id} className="visualization-card">
              <div className="card-header">
                <h3>🎵 {visualization.id}</h3>
                <span className="file-info">Audio: {visualization.audioFile}</span>
              </div>
              
              {/* Audio Visualizations */}
              <div className="audio-visualizations">
                <h4>📊 Original Audio</h4>
                <div className="visualization-pair">
                  <div className="waveform-mini">
                    <span>Waveform</span>
                    <div className="waveform-placeholder">
                      <WaveformMini audioUrl={`/audio/${visualization.audioFile}`} />
                    </div>
                  </div>
                  <div className="spectrogram-mini">
                    <span>Spectrogram</span>
                    <SpectrogramMini data={visualization.spectrogramData} />
                  </div>
                </div>
              </div>
              
              {/* Vibration Visualizations */}
              <div className="vibration-visualizations">
                <h4>🔊 Vibration Designs</h4>
                {visualization.vibrationVisualizations.map((vib) => (
                  <div key={vib.design} className="vibration-item">
                    <div className="vibration-header">
                      <span className="design-name">{vib.design}</span>
                      <span className="rating">{vib.rating.toFixed(1)}/100</span>
                    </div>
                    <div className="visualization-pair">
                      <div className="waveform-mini">
                        <span>Waveform</span>
                        <div className="waveform-placeholder">
                          <WaveformMini audioUrl={`/vibration/${vib.vibrationFile}`} />
                        </div>
                      </div>
                      <div className="spectrogram-mini">
                        <span>Spectrogram</span>
                        <SpectrogramMini data={vib.spectrogramData} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && visualizations.length === 0 && (
        <div className="no-selection">
          <h3>Select an Audio File</h3>
          <p>Choose an audio file from the list above to view its waveform and spectrogram analysis.</p>
        </div>
      )}
    </div>
  );
};

// Mini Waveform Component using Canvas
const WaveformMini: React.FC<{ audioUrl: string }> = ({ audioUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateWaveform = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Get audio data
        const channelData = audioBuffer.getChannelData(0);
        const samples = channelData.length;

        // Downsample for visualization (take every nth sample)
        const downsampleFactor = Math.max(1, Math.floor(samples / width));
        const downsampledData = [];
        
        for (let i = 0; i < samples; i += downsampleFactor) {
          let sum = 0;
          for (let j = 0; j < downsampleFactor && i + j < samples; j++) {
            sum += Math.abs(channelData[i + j]);
          }
          downsampledData.push(sum / downsampleFactor);
        }

        // Find max amplitude for normalization
        const maxAmplitude = Math.max(...downsampledData);
        
        // Draw waveform
        ctx.strokeStyle = '#4F4A85';
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let i = 0; i < downsampledData.length; i++) {
          const x = (i / downsampledData.length) * width;
          const amplitude = downsampledData[i] / maxAmplitude;
          const y = (height / 2) + (amplitude * (height / 2));
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
        setIsLoading(false);
      } catch (error) {
        console.error('Error generating waveform for:', audioUrl, error);
        setError('Failed to generate waveform');
        setIsLoading(false);
      }
    };

    generateWaveform();
  }, [audioUrl]);

  if (isLoading) {
    return <div className="waveform-loading">Loading...</div>;
  }

  if (error) {
    return <div className="waveform-error">Waveform unavailable</div>;
  }

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={40}
      style={{ borderRadius: '4px', border: '1px solid #dee2e6' }}
    />
  );
};

// Mini Spectrogram Component
const SpectrogramMini: React.FC<{ data: number[][] }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const numFrames = data.length;
    const numFreqBins = data[0].length;

    const frameWidth = width / numFrames;
    const freqHeight = height / numFreqBins;

    // Find global min/max for proper scaling
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let frame = 0; frame < numFrames; frame++) {
      for (let freq = 0; freq < numFreqBins; freq++) {
        const val = data[frame][freq];
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      }
    }

    // Color gradient function (similar to standard spectrogram colors)
    const getColor = (value: number) => {
      const normalized = (value - minVal) / (maxVal - minVal);
      
      // Use a color map similar to standard spectrograms
      // Dark blue -> Light blue -> Green -> Yellow -> Red
      if (normalized < 0.2) {
        // Dark blue to light blue
        const t = normalized / 0.2;
        return `rgb(${Math.round(0 + t * 0)}, ${Math.round(0 + t * 100)}, ${Math.round(100 + t * 155)})`;
      } else if (normalized < 0.4) {
        // Light blue to green
        const t = (normalized - 0.2) / 0.2;
        return `rgb(${Math.round(0 + t * 100)}, ${Math.round(100 + t * 155)}, ${Math.round(255 - t * 100)})`;
      } else if (normalized < 0.6) {
        // Green to yellow
        const t = (normalized - 0.4) / 0.2;
        return `rgb(${Math.round(100 + t * 155)}, ${Math.round(255)}, ${Math.round(155 - t * 155)})`;
      } else if (normalized < 0.8) {
        // Yellow to orange
        const t = (normalized - 0.6) / 0.2;
        return `rgb(${Math.round(255)}, ${Math.round(255 - t * 100)}, ${Math.round(0 + t * 100)})`;
      } else {
        // Orange to red
        const t = (normalized - 0.8) / 0.2;
        return `rgb(${Math.round(255)}, ${Math.round(155 - t * 155)}, ${Math.round(100 + t * 155)})`;
      }
    };

    for (let frame = 0; frame < numFrames; frame++) {
      for (let freq = 0; freq < numFreqBins; freq++) {
        const val = data[frame][freq];
        
        ctx.fillStyle = getColor(val);
        ctx.fillRect(
          frame * frameWidth,
          height - (freq + 1) * freqHeight,
          frameWidth,
          freqHeight
        );
      }
    }
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={40}
      style={{ borderRadius: '4px', border: '1px solid #dee2e6' }}
    />
  );
};

export default VisualizationGrid; 