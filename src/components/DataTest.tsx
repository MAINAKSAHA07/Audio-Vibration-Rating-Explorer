import React from 'react';
import { RatingData } from '../utils/api';
import { getClassStats, getAudioFilesForClass } from '../utils/dataHelpers';

interface DataTestProps {
  ratings: RatingData[];
  selectedClass: string;
}

const DataTest: React.FC<DataTestProps> = ({ ratings, selectedClass }) => {
  if (!selectedClass) {
    return <div>No class selected</div>;
  }

  const classStats = getClassStats(ratings, selectedClass);
  const audioFiles = getAudioFilesForClass(ratings, selectedClass);
  const vibrationFiles = ratings.filter(r => r.class === selectedClass);

  return (
    <div style={{ padding: '1rem', background: '#f0f0f0', margin: '1rem 0', borderRadius: '8px' }}>
      <h3>Data Test for Class {selectedClass}</h3>
      <div style={{ lineHeight: '1.6' }}>
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Class Stats:</p>
          <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.5rem' }}>
            <li style={{ marginBottom: '0.25rem' }}>Class: {classStats.class}</li>
            <li style={{ marginBottom: '0.25rem' }}>Category: {classStats.category}</li>
            <li style={{ marginBottom: '0.25rem' }}>Total Count: {classStats.totalCount}</li>
            <li style={{ marginBottom: '0.25rem' }}>Designs: {classStats.designs.length}</li>
          </ul>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Audio Files: {audioFiles.length}</p>
          <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.5rem' }}>
            {audioFiles.slice(0, 3).map(audio => (
              <li key={audio.id} style={{ marginBottom: '0.25rem' }}>
                {audio.id} - {audio.rating} ({audio.design})
              </li>
            ))}
          </ul>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Vibration Files: {vibrationFiles.length}</p>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ marginBottom: '0.25rem' }}>
            <strong>Sample Audio URL:</strong> {audioFiles[0]?.audioFile}
          </p>
          <p style={{ marginBottom: '0.25rem' }}>
            <strong>Sample Vibration URL:</strong> {vibrationFiles[0]?.vibrationFile}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataTest; 