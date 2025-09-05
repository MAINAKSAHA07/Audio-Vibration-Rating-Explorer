const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

// Simple FFT implementation for Node.js
function performFFT(data) {
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
}

// Generate waveform data from audio buffer
function generateWaveformData(audioBuffer, width = 120) {
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
}

// Generate spectrogram data from audio buffer
function generateSpectrogramData(audioBuffer) {
  const numberOfSamples = audioBuffer.length;
  const frameSize = 512;
  const hopSize = frameSize / 4;
  const numFrames = Math.floor((numberOfSamples - frameSize) / hopSize);
  const numFreqBins = frameSize / 2;
  
  const spectrogram = [];
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
}

// Decode WAV file using Node.js (simplified)
function decodeWavFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  
  // Simple WAV header parsing
  const header = buffer.toString('ascii', 0, 12);
  if (header !== 'RIFF') {
    throw new Error('Not a valid WAV file');
  }
  
  // Extract basic info
  const sampleRate = buffer.readUInt32LE(24);
  const numChannels = buffer.readUInt16LE(22);
  const bitsPerSample = buffer.readUInt16LE(34);
  const dataSize = buffer.readUInt32LE(40);
  
  // Find data chunk
  let dataOffset = 44;
  for (let i = 12; i < buffer.length - 8; i += 4) {
    const chunkId = buffer.toString('ascii', i, i + 4);
    const chunkSize = buffer.readUInt32LE(i + 4);
    if (chunkId === 'data') {
      dataOffset = i + 8;
      break;
    }
    i += chunkSize;
  }
  
  // Extract audio data
  const audioData = buffer.slice(dataOffset, dataOffset + dataSize);
  const samples = new Float32Array(dataSize / 2); // Assuming 16-bit
  
  for (let i = 0; i < samples.length; i++) {
    const sample = audioData.readInt16LE(i * 2);
    samples[i] = sample / 32768.0; // Normalize to [-1, 1]
  }
  
  return {
    length: samples.length,
    duration: samples.length / sampleRate,
    sampleRate: sampleRate,
    numberOfChannels: numChannels,
    getChannelData: (channel) => samples
  };
}

async function generateAllVisualizations() {
  console.log('🎵 Generating all visualizations...');
  
  // Create output directory
  const outputDir = path.join(__dirname, '../public/data/visualizations');
  await fs.ensureDir(outputDir);
  
  // Get all audio files
  const audioFiles = glob.sync('audio_vibration/audio/*.wav');
  console.log(`Found ${audioFiles.length} audio files`);
  
  const visualizations = {};
  let processed = 0;
  
  for (const audioFile of audioFiles) {
    try {
      const fileName = path.basename(audioFile, '.wav');
      console.log(`Processing ${fileName} (${processed + 1}/${audioFiles.length})`);
      
      // Decode audio file
      const audioBuffer = decodeWavFile(audioFile);
      
      // Generate waveform data
      const waveformData = generateWaveformData(audioBuffer, 120);
      
      // Generate spectrogram data
      const spectrogramData = generateSpectrogramData(audioBuffer);
      
      // Store visualization data
      visualizations[fileName] = {
        waveform: waveformData,
        spectrogram: spectrogramData,
        duration: audioBuffer.duration
      };
      
      processed++;
      
      // Progress update
      if (processed % 50 === 0) {
        console.log(`Progress: ${processed}/${audioFiles.length} (${Math.round(processed/audioFiles.length*100)}%)`);
      }
    } catch (error) {
      console.error(`Error processing ${audioFile}:`, error.message);
    }
  }
  
  // Get all vibration files
  const vibrationFiles = glob.sync('audio_vibration/vibration/*.wav');
  console.log(`Found ${vibrationFiles.length} vibration files`);
  
  processed = 0;
  
  for (const vibrationFile of vibrationFiles) {
    try {
      const fileName = path.basename(vibrationFile, '.wav');
      console.log(`Processing vibration ${fileName} (${processed + 1}/${vibrationFiles.length})`);
      
      // Decode vibration file
      const audioBuffer = decodeWavFile(vibrationFile);
      
      // Generate waveform data
      const waveformData = generateWaveformData(audioBuffer, 120);
      
      // Generate spectrogram data
      const spectrogramData = generateSpectrogramData(audioBuffer);
      
      // Store visualization data
      visualizations[fileName] = {
        waveform: waveformData,
        spectrogram: spectrogramData,
        duration: audioBuffer.duration
      };
      
      processed++;
      
      // Progress update
      if (processed % 50 === 0) {
        console.log(`Progress: ${processed}/${vibrationFiles.length} (${Math.round(processed/vibrationFiles.length*100)}%)`);
      }
    } catch (error) {
      console.error(`Error processing ${vibrationFile}:`, error.message);
    }
  }
  
  // Save all visualizations
  const outputFile = path.join(outputDir, 'all-visualizations.json');
  await fs.writeJson(outputFile, visualizations, { spaces: 2 });
  
  console.log(`✅ Generated visualizations for ${Object.keys(visualizations).length} files`);
  console.log(`📁 Saved to: ${outputFile}`);
  
  // Generate summary
  const summary = {
    totalFiles: Object.keys(visualizations).length,
    audioFiles: audioFiles.length,
    vibrationFiles: vibrationFiles.length,
    generatedAt: new Date().toISOString()
  };
  
  const summaryFile = path.join(outputDir, 'summary.json');
  await fs.writeJson(summaryFile, summary, { spaces: 2 });
  
  console.log(`📊 Summary saved to: ${summaryFile}`);
}

// Run the generation
generateAllVisualizations().catch(console.error); 