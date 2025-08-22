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

    console.log('AudioPlayer: Initializing for URL:', audioUrl);

    // Test if audio file is accessible
    const testAudioAccess = async () => {
      try {
        const response = await fetch(audioUrl, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        console.log('AudioPlayer: Audio file accessible:', audioUrl);
      } catch (error) {
        console.error('AudioPlayer: Audio file not accessible:', audioUrl, error);
        setError(`Audio file not accessible: ${error}`);
        setIsLoading(false);
        return false;
      }
      return true;
    };

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
        normalize: true,
      });

      wavesurferRef.current = wavesurfer;

      // Test accessibility and then load audio
      testAudioAccess().then((isAccessible) => {
        if (isAccessible) {
          try {
            console.log('AudioPlayer: Loading audio file:', audioUrl);
            wavesurfer.load(audioUrl);
          } catch (error) {
            console.error('Error loading audio:', audioUrl, error);
            setError(`Failed to load audio: ${error}`);
            setIsLoading(false);
          }
        }
      });

    } catch (error) {
      console.error('Error creating WaveSurfer:', error);
      setError('Failed to initialize audio player');
      setIsLoading(false);
      return;
    }

    // Event listeners
    wavesurfer.on('ready', () => {
      console.log('AudioPlayer: Audio ready for:', audioUrl);
      setDuration(wavesurfer.getDuration());
      setIsLoading(false);
      setError(null);
    });

    wavesurfer.on('timeupdate', (currentTime) => {
      setCurrentTime(currentTime);
    });

    wavesurfer.on('play', () => {
      console.log('AudioPlayer: Play started for:', audioUrl);
      setIsPlaying(true);
    });

    wavesurfer.on('pause', () => {
      console.log('AudioPlayer: Play paused for:', audioUrl);
      setIsPlaying(false);
    });

    wavesurfer.on('finish', () => {
      console.log('AudioPlayer: Play finished for:', audioUrl);
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
        console.warn('AudioPlayer: Loading timeout for:', audioUrl);
        setError('Audio loading timeout');
        setIsLoading(false);
      }
    }, 15000); // 15 second timeout

    return () => {
      console.log('AudioPlayer: Cleaning up for:', audioUrl);
      clearTimeout(timeoutId);
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy();
        } catch (error) {
          console.error('Error destroying WaveSurfer:', error);
        }
      }
    };
  }, [audioUrl, height]); // Remove isLoading dependency to prevent re-renders

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
          <small>URL: {audioUrl}</small>
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
          <small>URL: {audioUrl}</small>
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