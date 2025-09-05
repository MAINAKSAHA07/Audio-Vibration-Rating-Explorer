import React, { useState, useRef, useEffect } from 'react';

interface SimpleAudioPlayerProps {
  audioUrl: string;
  title: string;
}

const SimpleAudioPlayer: React.FC<SimpleAudioPlayerProps> = ({ audioUrl, title }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canPlay, setCanPlay] = useState(false);

  // Reset state when audioUrl changes
  useEffect(() => {
    console.log('SimpleAudioPlayer: URL changed to:', audioUrl);
    setIsLoading(true);
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setCanPlay(false);
  }, [audioUrl]);

  const togglePlayPause = async () => {
    console.log('SimpleAudioPlayer: Toggle clicked for:', audioUrl);
    
    if (!audioRef.current) {
      console.error('SimpleAudioPlayer: Audio element not found');
      return;
    }

    try {
      if (isPlaying) {
        console.log('SimpleAudioPlayer: Pausing audio');
        audioRef.current.pause();
      } else {
        console.log('SimpleAudioPlayer: Attempting to play audio');
        
        // Ensure the audio source is set
        if (!audioRef.current.src || audioRef.current.src !== audioUrl) {
          console.log('SimpleAudioPlayer: Setting audio source to:', audioUrl);
          audioRef.current.src = audioUrl;
        }
        
        // Try to play the audio
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          console.log('SimpleAudioPlayer: Audio started playing successfully');
        }
      }
    } catch (error) {
      console.error('SimpleAudioPlayer: Playback error:', error);
      
      // Handle specific autoplay policy errors
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setError('Audio playback blocked by browser. Please click the play button to start audio.');
        } else if (error.name === 'NotSupportedError') {
          setError('Audio format not supported by browser.');
        } else {
          setError(`Playback error: ${error.message}`);
        }
      } else {
        setError('Unknown playback error occurred');
      }
      
      setIsPlaying(false);
    }
  };

  const handleLoadedMetadata = () => {
    console.log('SimpleAudioPlayer: Audio metadata loaded for:', audioUrl);
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
      setError(null);
      console.log('SimpleAudioPlayer: Duration:', audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handlePlay = () => {
    console.log('SimpleAudioPlayer: Audio play event triggered for:', audioUrl);
    setIsPlaying(true);
    setIsLoading(false);
    setError(null);
  };

  const handlePause = () => {
    console.log('SimpleAudioPlayer: Audio pause event triggered for:', audioUrl);
    setIsPlaying(false);
  };

  const handleError = (e: any) => {
    console.error('SimpleAudioPlayer: Audio error for:', audioUrl, e);
    const errorMessage = e.target?.error?.message || 'Unknown error';
    setError(`Failed to load audio file: ${errorMessage}`);
    setIsLoading(false);
    setIsPlaying(false);
    setCanPlay(false);
  };

  const handleCanPlay = () => {
    console.log('SimpleAudioPlayer: Audio can play for:', audioUrl);
    setIsLoading(false);
    setError(null);
    setCanPlay(true);
  };

  const handleLoadStart = () => {
    console.log('SimpleAudioPlayer: Audio load started for:', audioUrl);
    setIsLoading(true);
    setCanPlay(false);
  };

  const handleLoadedData = () => {
    console.log('SimpleAudioPlayer: Audio data loaded for:', audioUrl);
    setIsLoading(false);
  };

  const handleStalled = () => {
    console.log('SimpleAudioPlayer: Audio stalled for:', audioUrl);
  };

  const handleSuspend = () => {
    console.log('SimpleAudioPlayer: Audio suspended for:', audioUrl);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Show different button states based on loading and error conditions
  const getButtonText = () => {
    if (isLoading) return '⏳ Loading...';
    if (error) return '🔄 Retry';
    if (isPlaying) return '⏸️ Pause';
    return '▶️ Play';
  };

  const isButtonDisabled = isLoading && !error;

  return (
    <div className="audio-player">
      <button 
        onClick={togglePlayPause} 
        className="play-button" 
        disabled={isButtonDisabled}
        title={error || title}
      >
        {getButtonText()}
      </button>
      <span className="time-display">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
      {error && (
        <span className="error-indicator" title={error}>⚠️</span>
      )}
      {!error && !isLoading && !canPlay && (
        <span className="warning-indicator" title="Audio not ready">⏳</span>
      )}
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadStart={handleLoadStart}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={handleLoadedData}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onError={handleError}
        onCanPlay={handleCanPlay}
        onStalled={handleStalled}
        onSuspend={handleSuspend}
        preload="metadata"
        controls={false}
        crossOrigin="anonymous"
      />
    </div>
  );
};

export default SimpleAudioPlayer;
