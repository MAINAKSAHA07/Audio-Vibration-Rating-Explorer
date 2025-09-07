import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ClassStats } from '../utils/dataHelpers';
import { RatingData } from '../utils/api';
import WaveSurferPlayer from './WaveSurferPlayer';
import SimpleAudioPlayer from './SimpleAudioPlayer';
import DualViewPlayer from './DualViewPlayer';
import EC2AudioPlayer from './EC2AudioPlayer';

interface ClassDetailProps {
  classStats: ClassStats;
  audioFiles: RatingData[];
  vibrationFiles: RatingData[];
}

const ClassDetail: React.FC<ClassDetailProps> = ({ classStats, audioFiles, vibrationFiles }) => {
  const [selectedAudio, setSelectedAudio] = useState<RatingData | null>(audioFiles[0] || null);
  const [useSimplePlayer, setUseSimplePlayer] = useState(true); // Default to simple player
  const [useDualView, setUseDualView] = useState(false); // Dual view option

  const chartData = classStats.designs.map(design => ({
    design: design.design.charAt(0).toUpperCase() + design.design.slice(1),
    rating: design.averageRating,
    count: design.count
  }));

  const handleAudioSelect = (audio: RatingData) => {
    setSelectedAudio(audio);
  };

  const getVibrationFilesForAudio = (audioId: string) => {
    return vibrationFiles.filter(v => v.id === audioId);
  };

  // Add error handling for missing data
  if (!classStats || audioFiles.length === 0) {
    return (
      <div className="class-detail">
        <h2>Class {classStats?.class || 'Unknown'} - {classStats?.category || 'Unknown'}</h2>
        <div className="error">
          <p>No data available for this class or error loading data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="class-detail">
      <h2>Class {classStats.class} - {classStats.category}</h2>
      
      {/* Chart */}
      <div className="chart-section">
        <h3>Average Ratings by Design</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="design" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)}`, 'Average Rating']}
                labelFormatter={(label) => `Design: ${label}`}
              />
              <Bar dataKey="rating" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Audio Selection */}
      <div className="audio-selection">
        <h3>Audio Files ({audioFiles.length})</h3>
        <div className="audio-list">
          {audioFiles.map((audio, index) => (
            <button
              key={audio.id}
              onClick={() => handleAudioSelect(audio)}
              className={`audio-button ${selectedAudio?.id === audio.id ? 'selected' : ''}`}
            >
              {audio.id} (Rating: {audio.rating})
            </button>
          ))}
        </div>
      </div>

              {/* Audio and Vibration Players */}
        {selectedAudio && (
          <div className="players-section">
            <h3>Audio and Vibration Comparison</h3>
            
            {/* Player Type Toggle */}
            <div className="player-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={useSimplePlayer}
                  onChange={(e) => {
                    setUseSimplePlayer(e.target.checked);
                    if (e.target.checked) setUseDualView(false);
                  }}
                />
                Use Simple Audio Player (Recommended for better compatibility)
              </label>
              {/* <label>
                <input
                  type="checkbox"
                  checked={useDualView}
                  onChange={(e) => {
                    setUseDualView(e.target.checked);
                    if (e.target.checked) setUseSimplePlayer(false);
                  }}
                />
                Use Dual View Player (Waveform + Spectrogram Analysis)
              </label> */}
            </div>
            
            {/* Original Audio */}
            <div className="player-container">
              <EC2AudioPlayer
                audioFile={selectedAudio.audioFile}
                title={`Original Audio: ${selectedAudio.id}`}
                height={120}
                showSource={true}
                onLoad={(url) => {
                  console.log(`Audio loaded from EC2: ${url}`);
                }}
                onError={(error) => {
                  console.error('Audio loading error:', error);
                }}
              />
            </div>

            {/* Vibration Files */}
            <div className="vibration-players">
              <h4>Vibration Designs</h4>
              {getVibrationFilesForAudio(selectedAudio.id).map((vibration) => (
                <div key={vibration.design} className="vibration-player">
                  <AWSAudioPlayer
                    audioFile={vibration.vibrationFile}
                    title={`${vibration.design.charAt(0).toUpperCase() + vibration.design.slice(1)}: ${vibration.rating.toFixed(1)}/100`}
                    height={100}
                    showSource={true}
                    onLoad={(url, source) => {
                      console.log(`Vibration loaded from ${source}: ${url}`);
                    }}
                    onError={(error) => {
                      console.error('Vibration loading error:', error);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};

export default ClassDetail; 