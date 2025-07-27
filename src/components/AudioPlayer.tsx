import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface AudioPlayerProps {
  audioUrl: string;
  title: string;
  height?: number;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, title, height = 100 }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!waveformRef.current) return;

    // Initialize WaveSurfer
    let wavesurfer: WaveSurfer;
    try {
      wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#4F4A85',
        progressColor: '#383351',
        cursorColor: '#fff',
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 1,
        height: height,
        barGap: 3,
      });

      wavesurferRef.current = wavesurfer;

      // Load audio with error handling
      try {
        wavesurfer.load(audioUrl);
      } catch (error) {
        console.error('Error loading audio:', audioUrl, error);
        setError(`Failed to load audio: ${error}`);
      }
    } catch (error) {
      console.error('Error creating WaveSurfer:', error);
      setError('Failed to initialize audio player');
      return;
    }

    // Event listeners
    wavesurfer.on('ready', () => {
      setDuration(wavesurfer.getDuration());
      setIsLoading(false);
    });

    wavesurfer.on('audioprocess', () => {
      setCurrentTime(wavesurfer.getCurrentTime());
    });

    wavesurfer.on('play', () => {
      setIsPlaying(true);
    });

    wavesurfer.on('pause', () => {
      setIsPlaying(false);
    });

    wavesurfer.on('finish', () => {
      setIsPlaying(false);
    });

    wavesurfer.on('error', (error) => {
      console.error('WaveSurfer error for:', audioUrl, error);
      setError(`Failed to load audio: ${error}`);
      setIsLoading(false);
    });

    // Add timeout for loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setError('Audio loading timeout');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => {
      clearTimeout(timeoutId);
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy();
        } catch (error) {
          console.error('Error destroying WaveSurfer:', error);
        }
      }
    };
  }, [audioUrl, height, isLoading]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="audio-player">
        <h3>{title}</h3>
        <div className="loading">
          <p>Loading audio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="audio-player">
        <h3>{title}</h3>
        <div className="error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="audio-player">
      <h3>{title}</h3>
      <div ref={waveformRef} className="waveform" />
      <div className="controls">
        <button onClick={togglePlayPause} className="play-button">
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
        <span className="time-display">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

export default AudioPlayer; 