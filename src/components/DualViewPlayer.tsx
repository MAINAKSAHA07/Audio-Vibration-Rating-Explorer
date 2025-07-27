import React, { useEffect, useRef, useState, useCallback } from 'react';

interface DualViewPlayerProps {
  audioUrl: string;
  title: string;
  height?: number;
}

const DualViewPlayer: React.FC<DualViewPlayerProps> = ({ 
  audioUrl, 
  title, 
  height = 120 
}) => {
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const spectrogramCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [spectrogramData, setSpectrogramData] = useState<number[][]>([]);

  // Initialize Web Audio API for spectrogram (visualization only)
  const initAudioContext = useCallback(async () => {
    try {
      console.log('Initializing audio context for:', audioUrl);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      console.log('Fetching audio file...');
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('Decoding audio data...');
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log('Generating spectrogram data...');
      // Generate spectrogram data without connecting to audio output
      try {
        const spectrogramData = generateSpectrogramData(audioBuffer);
        setSpectrogramData(spectrogramData);
        console.log('Spectrogram data generated successfully');
      } catch (error) {
        console.error('Error generating spectrogram:', error);
        // Continue without spectrogram if it fails
        setSpectrogramData([]);
      }
      
      return { audioContext, audioBuffer };
    } catch (error) {
      console.error('Error initializing audio context:', error);
      setError(`Failed to initialize audio analysis: ${error}`);
      return null;
    }
  }, [audioUrl]);

  // Generate spectrogram data from audio buffer with proper FFT
  const generateSpectrogramData = (audioBuffer: AudioBuffer): number[][] => {
    const numberOfSamples = audioBuffer.length;
    console.log('Generating spectrogram for', numberOfSamples, 'samples');
    
    const frameSize = 512; // Increased for better frequency resolution
    const hopSize = frameSize / 4; // Smaller hop for better time resolution
    const numFrames = Math.floor((numberOfSamples - frameSize) / hopSize);
    const numFreqBins = frameSize / 2;
    
    console.log('Spectrogram parameters:', { frameSize, hopSize, numFrames, numFreqBins });
    
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
    
    console.log('Generated spectrogram with', spectrogram.length, 'frames');
    return spectrogram;
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

  // Draw spectrogram on canvas
  const drawSpectrogram = useCallback(() => {
    console.log('Drawing spectrogram, data length:', spectrogramData.length);
    const canvas = spectrogramCanvasRef.current;
    if (!canvas) {
      console.error('Canvas ref not found');
      return;
    }
    if (spectrogramData.length === 0) {
      console.log('No spectrogram data available');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    const numFrames = spectrogramData.length;
    const numFreqBins = spectrogramData[0].length;
    
    const frameWidth = width / numFrames;
    const freqHeight = height / numFreqBins;
    
    // Find min/max for normalization
    let minVal = Infinity;
    let maxVal = -Infinity;
    
    for (const frame of spectrogramData) {
      for (const val of frame) {
        minVal = Math.min(minVal, val);
        maxVal = Math.max(maxVal, val);
      }
    }
    
    const range = maxVal - minVal;
    
    // Color gradient function (similar to standard spectrogram colors)
    const getColor = (value: number) => {
      const normalized = (value - minVal) / range;
      
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

    // Draw spectrogram
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

  // Generate waveform using Canvas
  const generateWaveform = useCallback(async () => {
    try {
      console.log('Generating waveform for:', audioUrl);
      setIsLoading(true);
      setError(null);

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const canvas = waveformCanvasRef.current;
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

      // Downsample for visualization
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
      ctx.lineWidth = 2;
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
      setDuration(audioBuffer.duration);
      setIsLoading(false);
      
      // Initialize spectrogram after waveform is ready
      setTimeout(() => {
        initAudioContext().catch(error => {
          console.error('Failed to initialize spectrogram:', error);
        });
      }, 100);
    } catch (error) {
      console.error('Error generating waveform for:', audioUrl, error);
      setError(`Failed to generate waveform: ${error}`);
      setIsLoading(false);
    }
  }, [audioUrl, initAudioContext]);

  // Initialize waveform
  useEffect(() => {
    generateWaveform();
  }, [generateWaveform]);

  // Draw spectrogram when data is available
  useEffect(() => {
    if (spectrogramData.length > 0) {
      drawSpectrogram();
    }
  }, [spectrogramData, drawSpectrogram]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="dual-view-player">
        <h3>{title}</h3>
        <div className="loading">
          <p>Generating waveform and spectrogram visualizations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dual-view-player">
        <h3>{title}</h3>
        <div className="error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dual-view-player">
      <h3>{title}</h3>
      
      {/* Waveform Section */}
      <div className="waveform-section-large">
        <h3>📊 Waveform Analysis (Time Domain)</h3>
        <p className="section-description">
          Shows amplitude over time - peaks indicate loud sections, valleys show quiet parts
        </p>
        <div className="waveform-container">
          <canvas
          ref={waveformCanvasRef}
          width={800}
          height={height / 2}
          className="waveform-view-large"
          style={{ borderRadius: '8px', border: '1px solid #dee2e6' }}
        />
        </div>
      </div>
      
      {/* Spectrogram Section */}
      <div className="spectrogram-section-large">
        <h3>🎵 Spectrogram Analysis (Frequency Domain)</h3>
        <p className="section-description">
          Shows frequency content over time - colors indicate energy at different frequencies
        </p>
        <div className="spectrogram-container">
          {spectrogramData.length > 0 ? (
            <canvas
              ref={spectrogramCanvasRef}
              className="spectrogram-canvas-large"
              width={600}
              height={height}
            />
          ) : (
            <div className="spectrogram-placeholder-large">
              <p>🔍 Spectrogram analysis not available</p>
              <p className="spectrogram-note">Frequency analysis could not be generated</p>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="analysis-summary">
        <div className="summary-item">
          <span className="summary-icon">📊</span>
          <span className="summary-text">Waveform Analysis</span>
        </div>
        <div className="summary-item">
          <span className="summary-icon">🎵</span>
          <span className="summary-text">Spectrogram Analysis</span>
        </div>
        <div className="summary-item">
          <span className="summary-icon">⏱️</span>
          <span className="summary-text">Duration: {formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default DualViewPlayer; 