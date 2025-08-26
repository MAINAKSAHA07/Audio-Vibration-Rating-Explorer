import React, { useEffect, useState, useRef, useCallback } from 'react';
import { fetchRatings, RatingData } from '../utils/api';
import { getUniqueClasses, getAudioFilesForClass } from '../utils/dataHelpers';
import { AudioMotionAnalyzer } from 'audiomotion-analyzer';

interface VisualizationStructure {
  audio: Record<string, { type: string; file: string; url: string }>;
  vibration: Record<string, { type: string; file: string; url: string }>;
  summary: {
    audioFiles: number;
    vibrationFiles: number;
    totalFiles: number;
    generatedAt: string;
  };
}

interface VisualizationData {
  id: string;
  type: 'audio' | 'vibration';
  waveform: number[];
  spectrogram: number[][];
  duration: number;
}

interface ClassVisualizationData {
  classCode: string;
  category: string;
  audioFiles: RatingData[];
  visualizations: Record<string, VisualizationData>;
}

const PreGeneratedVisualizations: React.FC = () => {
  const [structure, setStructure] = useState<VisualizationStructure | null>(null);
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [classVisualizations, setClassVisualizations] = useState<Record<string, ClassVisualizationData>>({});

  // Load visualization structure and ratings data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [structureResponse, ratingsData] = await Promise.all([
          fetch('/data/visualizations/visualization-structure.json'),
          fetchRatings()
        ]);
        
        const structureData = await structureResponse.json();
        setStructure(structureData);
        setRatings(ratingsData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load visualization data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Generate waveform data from audio buffer
  const generateWaveformData = (audioBuffer: AudioBuffer, width = 120): number[] => {
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
    
    // Normalize
    const maxAmplitude = Math.max(...downsampledData);
    return downsampledData.map(amp => maxAmplitude > 0 ? amp / maxAmplitude : 0);
  };

  // Generate spectrogram data from audio buffer
  const generateSpectrogramData = (audioBuffer: AudioBuffer): number[][] => {
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
          return Math.max(0, 20 * Math.log10(normalized + 1e-10) + 60);
        }
        return 0;
      });
      
      spectrogram.push(frameMagnitudes);
    }
    
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

  // Generate visualizations for a specific class
  const generateVisualizationsForClass = useCallback(async (classCode: string) => {
    if (!structure || !ratings.length) return;

    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      // Get audio files for this class
      const audioFiles = getAudioFilesForClass(ratings, classCode);
      const category = audioFiles[0]?.category || 'Unknown';

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const visualizations: Record<string, VisualizationData> = {};
      
      let processed = 0;
      const totalFiles = audioFiles.length;

      for (const audioFile of audioFiles) {
        try {
          // Generate audio visualization
          const audioResponse = await fetch(`/audio/${audioFile.audioFile}`);
          const audioArrayBuffer = await audioResponse.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(audioArrayBuffer);

          visualizations[audioFile.id] = {
            id: audioFile.id,
            type: 'audio',
            waveform: generateWaveformData(audioBuffer),
            spectrogram: generateSpectrogramData(audioBuffer),
            duration: audioBuffer.duration
          };

          // Find associated vibration files
          const vibrationFiles = Object.keys(structure.vibration).filter(vibId => 
            vibId.startsWith(audioFile.id.split('-').slice(0, 3).join('-'))
          );

          for (const vibId of vibrationFiles) {
            try {
              const vibFile = structure.vibration[vibId];
              const vibResponse = await fetch(vibFile.url);
              const vibArrayBuffer = await vibResponse.arrayBuffer();
              const vibAudioBuffer = await audioContext.decodeAudioData(vibArrayBuffer);

              visualizations[vibId] = {
                id: vibId,
                type: 'vibration',
                waveform: generateWaveformData(vibAudioBuffer),
                spectrogram: generateSpectrogramData(vibAudioBuffer),
                duration: vibAudioBuffer.duration
              };
            } catch (error) {
              console.error(`Error processing vibration ${vibId}:`, error);
            }
          }

          processed++;
          setProgress((processed / totalFiles) * 100);
        } catch (error) {
          console.error(`Error processing audio ${audioFile.id}:`, error);
          processed++;
          setProgress((processed / totalFiles) * 100);
        }
      }

      // Store class visualization data
      setClassVisualizations(prev => ({
        ...prev,
        [classCode]: {
          classCode,
          category,
          audioFiles,
          visualizations
        }
      }));

      setLoading(false);
      setProgress(100);
    } catch (error) {
      console.error('Error generating visualizations for class:', classCode, error);
      setError('Failed to generate visualizations');
      setLoading(false);
    }
  }, [structure, ratings]);

  const handleClassSelect = (classCode: string) => {
    setSelectedClass(classCode);
    setSelectedAudio(null);
    generateVisualizationsForClass(classCode);
  };

  const handleAudioSelect = (audioId: string) => {
    setSelectedAudio(audioId);
  };

  if (loading && !structure) {
    return (
      <div className="visualization-grid">
        <div className="loading-section">
          <h2>🎵 Loading Visualization Structure</h2>
          <p>Loading file structure and preparing visualizations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="visualization-grid">
        <div className="error-section">
          <h2>❌ Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!structure || !ratings.length) {
    return (
      <div className="visualization-grid">
        <div className="error-section">
          <h2>❌ No Data</h2>
          <p>No visualization structure or ratings data found.</p>
        </div>
      </div>
    );
  }

  const classes = getUniqueClasses(ratings);
  const currentClassData = selectedClass ? classVisualizations[selectedClass] : null;

  return (
    <div className="visualization-grid">
      <div className="grid-header">
        <h2>📊 Generated Visualization Analysis</h2>
        <p>Select a class to view waveform and spectrogram analysis for all audio files</p>
        <div className="summary-info">
          <span>📁 {structure.summary.audioFiles} audio files</span>
          <span>🔊 {structure.summary.vibrationFiles} vibration files</span>
          <span>📊 {classes.length} classes</span>
        </div>
      </div>
      
      {/* Class Selection */}
      <div className="class-selection">
        <h3>Classes ({classes.length})</h3>
        <div className="class-list">
          {classes.map((classCode) => (
            <button
              key={classCode}
              onClick={() => handleClassSelect(classCode)}
              className={`class-button ${selectedClass === classCode ? 'selected' : ''}`}
            >
              Class {classCode}
            </button>
          ))}
        </div>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="loading-section">
          <h2>🎵 Generating Visualizations</h2>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p>Processing audio files and vibration designs for selected class...</p>
          <p className="progress-text">{Math.round(progress)}% Complete</p>
        </div>
      )}
      
      {/* Class Information and Audio Selection */}
      {!loading && currentClassData && (
        <div className="class-info">
          <h3>Class {currentClassData.classCode} - {currentClassData.category}</h3>
          <p>{currentClassData.audioFiles.length} audio files available</p>
          
          {/* Audio Selection */}
          <div className="audio-selection">
            <h4>Audio Files</h4>
            <div className="audio-list">
              {currentClassData.audioFiles.map((audioFile) => (
                <button
                  key={audioFile.id}
                  onClick={() => handleAudioSelect(audioFile.id)}
                  className={`audio-button ${selectedAudio === audioFile.id ? 'selected' : ''}`}
                >
                  {audioFile.id} (Rating: {audioFile.rating})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Visualizations */}
      {!loading && currentClassData && selectedAudio && (
        <div className="visualization-cards">
          {Object.values(currentClassData.visualizations)
            .filter(viz => viz.id.startsWith(selectedAudio.split('-').slice(0, 3).join('-')))
            .map((visualization) => (
            <div key={visualization.id} className="visualization-card">
              <div className="card-header">
                <h3>🎵 {visualization.id}</h3>
                <span className="file-info">{visualization.type}</span>
                <span className="duration">{visualization.duration.toFixed(1)}s</span>
              </div>
              
              <div className="visualization-pair">
                <div className="waveform-mini">
                  <span>Waveform</span>
                  <WaveformCanvas data={visualization.waveform} />
                </div>
                <div className="spectrogram-mini">
                  <span>Spectrogram</span>
                  <SpectrogramCanvas data={visualization.spectrogram} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && !currentClassData && (
        <div className="no-selection">
          <h3>Select a Class</h3>
          <p>Choose a class from the list above to view waveform and spectrogram analysis for all audio files in that class.</p>
        </div>
      )}
    </div>
  );
};

// Canvas components for rendering
const WaveformCanvas: React.FC<{ data: number[] }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = '#4F4A85';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const x = (i / data.length) * width;
      const amplitude = data[i];
      const y = (height / 2) + (amplitude * (height / 2));
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
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

const SpectrogramCanvas: React.FC<{ data: number[][] }> = ({ data }) => {
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

export default PreGeneratedVisualizations; 