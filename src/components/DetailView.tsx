import React from 'react';
import { DetailViewData } from './HierarchicalSunburst';
import colors from '../colors.js';

interface AudioFileDetail {
  filename: string;
  soundname: string;
  ratings: {
    freqshift: number;
    hapticgen: number;
    percept: number;
    pitchmatch: number;
  };
  average: number;
}

interface DetailViewProps {
  data: DetailViewData | null;
  onClose: () => void;
  onNavigateToFiltered?: () => void;
}

const DetailView: React.FC<DetailViewProps> = ({ data, onClose, onNavigateToFiltered }) => {
  if (!data) return null;

  const { category, subcategory, audioFiles, statistics } = data;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        width: '95vw',
        maxWidth: '1200px',
        minWidth: '800px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '15px'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937'
            }}>
              📊 {subcategory} Details
            </h2>
            <p style={{
              margin: '5px 0 0 0',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Category: {category}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '5px'
            }}
          >
            ×
          </button>
        </div>

        {/* Statistics Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: '#f0f9ff',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #0ea5e9'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0ea5e9' }}>
              {statistics.average.toFixed(1)}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Average Rating</div>
          </div>
          
          <div style={{
            backgroundColor: '#fef3c7',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #f59e0b'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
              {statistics.max.toFixed(1)}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Highest Rating</div>
          </div>
          
          <div style={{
            backgroundColor: '#fef2f2',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #ef4444'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
              {statistics.min.toFixed(1)}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Lowest Rating</div>
          </div>
          
          <div style={{
            backgroundColor: '#f0fdf4',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #22c55e'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
              {statistics.count}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Total Ratings</div>
          </div>
        </div>

        {/* Audio Files Details */}
        <div>
          <h3 style={{
            margin: '0 0 15px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#374151'
          }}>
            🎵 Audio File Details
          </h3>
          
          {audioFiles.map((file: AudioFileDetail, index: number) => (
            <div key={index} style={{
              backgroundColor: '#f9fafb',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '15px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <h4 style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  {file.soundname}
                </h4>
                <div style={{
                  backgroundColor: getRatingColor(file.average),
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {file.average.toFixed(1)}
                </div>
              </div>

              {/* Method Ratings */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '15px'
              }}>
                {Object.entries(file.ratings).map(([method, rating]: [string, number]) => (
                  <div key={method} style={{
                    backgroundColor: 'white',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'capitalize',
                      marginBottom: '5px'
                    }}>
                      {method}
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: getMethodColor(method)
                    }}>
                      {rating.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Rating Distribution */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{
            margin: '0 0 10px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#374151'
          }}>
            📈 Rating Distribution
          </h4>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              flex: 1,
              height: '8px',
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(statistics.average / 100) * 100}%`,
                height: '100%',
                backgroundColor: getRatingColor(statistics.average),
                borderRadius: '4px'
              }} />
            </div>
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              minWidth: '40px'
            }}>
              {statistics.average.toFixed(1)}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '5px',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          marginTop: '25px',
          textAlign: 'center',
          display: 'flex',
          gap: '15px',
          justifyContent: 'center'
        }}>
          {/* <button
            onClick={onClose}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
          >
            Close
          </button> */}
          
          {onNavigateToFiltered && (
            <button
              onClick={() => {
                onClose();
                onNavigateToFiltered();
              }}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                          >
                🔍 Detailed View
              </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions for colors
const getRatingColor = (rating: number): string => {
  if (rating >= 80) return '#22c55e'; // Green
  if (rating >= 60) return '#fbbf24'; // Yellow
  return '#ef4444'; // Red
};

const getMethodColor = (method: string): string => {
  const methodColors: Record<string, string> = {
    freqshift: colors(0), // Pink
    hapticgen: colors(1), // Blue
    percept: colors(2),   // Yellow
    pitchmatch: colors(3) // Lavender
  };
  return methodColors[method] || '#6b7280';
};

export default DetailView;
