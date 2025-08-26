import React, { useState, useRef, useEffect } from 'react';
import WaveSurferPlayer from './WaveSurferPlayer';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const processAudioFile = (file: File) => {
    setIsUploading(true);
    setError(null);

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
    setUploadedAudio(null);
    setAudioUrl(null);
    setError(null);
    setAudioDuration(null);
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

  return (
    <div className="audio-upload-container" style={{
      padding: '20px',
      maxWidth: '800px',
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
          🎵 Audio Upload & Player
        </h2>
        
        <p style={{
          color: '#666',
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          Upload any audio file to listen with our enhanced WaveSurfer player
        </p>

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
            <li>Once uploaded, you can play, pause, and visualize the audio waveform</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AudioUpload;
