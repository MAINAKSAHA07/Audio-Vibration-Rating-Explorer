import React, { useState, useEffect, useCallback } from 'react';

interface AudioDebuggerProps {
  audioUrl: string;
}

const AudioDebugger: React.FC<AudioDebuggerProps> = ({ audioUrl }) => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testAudioAccessibility = useCallback(async () => {
    addDebugInfo('Testing audio file accessibility...');
    
    try {
      const response = await fetch(audioUrl, { method: 'HEAD' });
      
      if (response.ok) {
        addDebugInfo(`✅ Audio file accessible! Status: ${response.status}`);
        addDebugInfo(`Content-Type: ${response.headers.get('content-type')}`);
        addDebugInfo(`Content-Length: ${response.headers.get('content-length')} bytes`);
        setTestResults(prev => ({ ...prev, accessibility: 'success' }));
      } else {
        addDebugInfo(`❌ Audio file not accessible. Status: ${response.status}`);
        setTestResults(prev => ({ ...prev, accessibility: 'failed' }));
      }
    } catch (error) {
      addDebugInfo(`❌ Audio file accessibility test failed: ${error}`);
      setTestResults(prev => ({ ...prev, accessibility: 'error' }));
    }
  }, [audioUrl]);

  const testAudioElement = useCallback(() => {
    addDebugInfo('Testing audio element creation...');
    
    const audio = new Audio(audioUrl);
    
    audio.addEventListener('loadstart', () => {
      addDebugInfo('Audio loadstart event fired');
    });
    
    audio.addEventListener('loadedmetadata', () => {
      addDebugInfo(`Audio loadedmetadata event fired. Duration: ${audio.duration}`);
      setTestResults(prev => ({ ...prev, metadata: 'success' }));
    });
    
    audio.addEventListener('canplay', () => {
      addDebugInfo('Audio canplay event fired');
      setTestResults(prev => ({ ...prev, canplay: 'success' }));
    });
    
    audio.addEventListener('error', (e) => {
      const target = e.target as HTMLAudioElement;
      const errorMessage = target.error?.message || 'Unknown error';
      addDebugInfo(`Audio error event fired: ${errorMessage}`);
      setTestResults(prev => ({ ...prev, error: 'failed' }));
    });
    
    // Try to load the audio
    audio.load();
    addDebugInfo('Audio.load() called');
  }, [audioUrl]);

  const testPlayback = async () => {
    addDebugInfo('Testing audio playback...');
    
    const audio = new Audio(audioUrl);
    
    try {
      // Wait for audio to be ready
      await new Promise((resolve, reject) => {
        audio.addEventListener('canplay', resolve);
        audio.addEventListener('error', (e) => {
          const target = e.target as HTMLAudioElement;
          reject(new Error(target.error?.message || 'Unknown error'));
        });
        audio.load();
      });
      
      addDebugInfo('Audio is ready, attempting playback...');
      
      await audio.play();
      addDebugInfo('✅ Audio playback successful!');
      setTestResults(prev => ({ ...prev, playback: 'success' }));
      
      // Stop after 2 seconds
      setTimeout(() => {
        audio.pause();
        addDebugInfo('Audio playback stopped');
      }, 2000);
      
    } catch (error) {
      addDebugInfo(`❌ Audio playback failed: ${error}`);
      setTestResults(prev => ({ ...prev, playback: 'failed' }));
    }
  };

  useEffect(() => {
    addDebugInfo(`AudioDebugger initialized for: ${audioUrl}`);
    testAudioAccessibility();
    testAudioElement();
  }, [audioUrl, testAudioAccessibility, testAudioElement]);

  return (
    <div className="audio-debugger" style={{
      background: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '16px',
      margin: '16px 0',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#495057' }}>Audio Debugger</h4>
      
      <div style={{ marginBottom: '12px' }}>
        <button 
          onClick={testAudioAccessibility}
          style={{ marginRight: '8px', padding: '4px 8px', fontSize: '11px' }}
        >
          Test Accessibility
        </button>
        <button 
          onClick={testAudioElement}
          style={{ marginRight: '8px', padding: '4px 8px', fontSize: '11px' }}
        >
          Test Audio Element
        </button>
        <button 
          onClick={testPlayback}
          style={{ padding: '4px 8px', fontSize: '11px' }}
        >
          Test Playback
        </button>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <strong>Test Results:</strong>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          {Object.entries(testResults).map(([test, result]) => (
            <span 
              key={test}
              style={{
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                backgroundColor: result === 'success' ? '#d4edda' : result === 'failed' ? '#f8d7da' : '#fff3cd',
                color: result === 'success' ? '#155724' : result === 'failed' ? '#721c24' : '#856404'
              }}
            >
              {test}: {result}
            </span>
          ))}
        </div>
      </div>
      
      <div style={{ 
        maxHeight: '200px', 
        overflowY: 'auto', 
        background: '#fff', 
        border: '1px solid #dee2e6',
        padding: '8px',
        borderRadius: '4px'
      }}>
        {debugInfo.map((info, index) => (
          <div key={index} style={{ marginBottom: '2px' }}>
            {info}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AudioDebugger;
